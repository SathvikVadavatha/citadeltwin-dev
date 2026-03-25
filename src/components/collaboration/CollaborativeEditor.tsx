
import { useEffect, useState, useCallback } from 'react';
import { useSimplifiedCollaboration } from '@/hooks/collaboration/useSimplifiedCollaboration';
import { operationalTransform, Operation } from './OperationalTransform';
import { LiveCursors } from './LiveCursors';
import { BIMElementsManager } from '@/components/bim/BIMElementsManager';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface CollaborativeEditorProps {
  projectId: string;
}

export const CollaborativeEditor = ({ projectId }: CollaborativeEditorProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<Operation[]>([]);
  const [elementState, setElementState] = useState<any>({});

  const {
    activeSession,
    userPresence,
    applyOperation,
    updateCursorPosition,
    applyBatchOperations,
  } = useSimplifiedCollaboration(projectId);

  // Handle incoming operations from collaboration
  const handleIncomingOperation = useCallback((operation: Operation) => {
    // Get local operations since the remote operation's timestamp
    const localOps = operationalTransform.getOperationsSince(operation.timestamp - 5000);
    
    // Transform the remote operation
    const transformResult = operationalTransform.transformOperation(operation, localOps);
    
    if (transformResult.priority === 'remote' || transformResult.priority === 'both') {
      // Apply the transformed operation to local state
      setElementState(currentState => 
        operationalTransform.applyOperation(transformResult.operation, currentState)
      );
    }
  }, []);

  // Handle local operations with simplified approach
  const handleLocalOperation = useCallback(async (operation: Omit<Operation, 'timestamp' | 'operationIndex'>) => {
    const fullOperation: Operation = {
      ...operation,
      timestamp: Date.now(),
      operationIndex: pendingOperations.length,
    };

    // Track the operation locally
    operationalTransform.trackLocalOperation(fullOperation);
    
    // Apply to local state immediately
    setElementState(currentState => 
      operationalTransform.applyOperation(fullOperation, currentState)
    );

    // Send to collaboration system
    if (activeSession) {
      await applyOperation({
        type: fullOperation.type,
        elementId: fullOperation.elementId,
        elementType: fullOperation.elementType,
        properties: fullOperation.data,
      });
    }
  }, [activeSession, applyOperation, pendingOperations.length]);

  // Connection status
  useEffect(() => {
    setIsConnected(!!activeSession);
  }, [activeSession]);

  return (
    <div className="relative h-full">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-40">
        <Card className="gradient-border">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">Disconnected</span>
                </>
              )}
              
              {userPresence.length > 0 && (
                <>
                  <div className="w-px h-4 bg-border" />
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="outline">{userPresence.length}</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Cursors */}
      <LiveCursors projectId={projectId} />

      {/* Collaborative BIM Editor */}
      <div className="h-full overflow-auto">
        <BIMElementsManager 
          projectId={projectId}
          // Pass collaboration handlers to enable real-time editing
        />
      </div>

      {/* Conflict Resolution Notification */}
      {pendingOperations.length > 0 && (
        <div className="absolute bottom-4 left-4 z-40">
          <Card className="gradient-border bg-warning/10">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                <span className="text-sm text-warning">
                  {pendingOperations.length} operation(s) syncing...
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
