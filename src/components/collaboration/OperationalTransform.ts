// Operational Transformation utilities for real-time collaboration
export interface Operation {
  type: 'create' | 'update' | 'delete' | 'transform';
  elementId: string;
  elementType: string;
  data: any;
  timestamp: number;
  userId: string;
  operationIndex: number;
}

export interface TransformResult {
  operation: Operation;
  priority: 'local' | 'remote' | 'both';
}

export class OperationalTransform {
  private static instance: OperationalTransform;
  private operations: Operation[] = [];

  static getInstance(): OperationalTransform {
    if (!OperationalTransform.instance) {
      OperationalTransform.instance = new OperationalTransform();
    }
    return OperationalTransform.instance;
  }

  // Transform a remote operation against local operations
  transformOperation(remoteOp: Operation, localOps: Operation[]): TransformResult {
    let transformedOp = { ...remoteOp };
    
    // Sort local operations by timestamp
    const sortedLocalOps = localOps.sort((a, b) => a.timestamp - b.timestamp);
    
    for (const localOp of sortedLocalOps) {
      // Only transform against operations that happened before the remote operation
      if (localOp.timestamp <= remoteOp.timestamp) {
        transformedOp = this.transformAgainstOperation(transformedOp, localOp);
      }
    }

    return {
      operation: transformedOp,
      priority: this.determinePriority(remoteOp, localOps),
    };
  }

  private transformAgainstOperation(op1: Operation, op2: Operation): Operation {
    // Same element operations
    if (op1.elementId === op2.elementId) {
      return this.transformSameElement(op1, op2);
    }

    // Different element operations - usually no transformation needed
    return op1;
  }

  private transformSameElement(remoteOp: Operation, localOp: Operation): Operation {
    const transformed = { ...remoteOp };

    switch (localOp.type) {
      case 'delete':
        // If local operation deleted the element, remote operation is no-op
        if (remoteOp.type !== 'create') {
          transformed.type = 'delete'; // Convert to no-op
        }
        break;

      case 'update':
        // Merge updates - remote operation takes precedence for conflicts
        if (remoteOp.type === 'update') {
          transformed.data = {
            ...localOp.data,
            ...remoteOp.data,
          };
        }
        break;

      case 'transform':
        // Transform position-based operations
        if (remoteOp.type === 'transform') {
          transformed.data = this.transformPosition(remoteOp.data, localOp.data);
        }
        break;

      case 'create':
        // Handle creation conflicts - use timestamp to determine winner
        if (remoteOp.type === 'create') {
          if (localOp.timestamp < remoteOp.timestamp) {
            // Local operation won, convert remote to update
            transformed.type = 'update';
          }
        }
        break;
    }

    return transformed;
  }

  private transformPosition(remotePos: any, localPos: any): any {
    // Simple position transformation - add relative movement
    if (remotePos.x !== undefined && localPos.x !== undefined) {
      return {
        ...remotePos,
        x: remotePos.x + (localPos.deltaX || 0),
        y: remotePos.y + (localPos.deltaY || 0),
      };
    }
    return remotePos;
  }

  private determinePriority(remoteOp: Operation, localOps: Operation[]): 'local' | 'remote' | 'both' {
    // Check for conflicts
    const conflictingOps = localOps.filter(localOp => 
      localOp.elementId === remoteOp.elementId && 
      Math.abs(localOp.timestamp - remoteOp.timestamp) < 1000 // 1 second conflict window
    );

    if (conflictingOps.length === 0) {
      return 'remote';
    }

    // For conflicts, use user ID as tiebreaker (deterministic)
    const conflictingOp = conflictingOps[0];
    if (remoteOp.userId > conflictingOp.userId) {
      return 'remote';
    } else {
      return 'local';
    }
  }

  // Apply an operation to the current state
  applyOperation(operation: Operation, currentState: any): any {
    const newState = { ...currentState };

    switch (operation.type) {
      case 'create':
        newState.elements = {
          ...newState.elements,
          [operation.elementId]: operation.data,
        };
        break;

      case 'update':
        if (newState.elements[operation.elementId]) {
          newState.elements[operation.elementId] = {
            ...newState.elements[operation.elementId],
            ...operation.data,
          };
        }
        break;

      case 'delete':
        delete newState.elements[operation.elementId];
        break;

      case 'transform':
        if (newState.elements[operation.elementId]) {
          newState.elements[operation.elementId] = {
            ...newState.elements[operation.elementId],
            position: operation.data,
          };
        }
        break;
    }

    return newState;
  }

  // Track a local operation
  trackLocalOperation(operation: Operation): void {
    this.operations.push(operation);
    
    // Keep only recent operations (last 1000 operations)
    if (this.operations.length > 1000) {
      this.operations = this.operations.slice(-1000);
    }
  }

  // Get operations since a certain timestamp
  getOperationsSince(timestamp: number): Operation[] {
    return this.operations.filter(op => op.timestamp > timestamp);
  }

  // Clear old operations
  clearOperationsBefore(timestamp: number): void {
    this.operations = this.operations.filter(op => op.timestamp >= timestamp);
  }
}

export const operationalTransform = OperationalTransform.getInstance();
