
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useStableCollaboration } from '@/hooks/collaboration/useStableCollaboration';
import { operationalTransform, Operation } from './OperationalTransform';
import { LiveCursors } from './LiveCursors';
import { BIMElementsManager } from '@/components/bim/BIMElementsManager';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface StableCollaborativeEditorProps {
  projectId: string;
}

export const StableCollaborativeEditor = React.memo<StableCollaborativeEditorProps>(({ projectId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<Operation[]>([]);
  const [elementState, setElementState] = useState<any>({});
  
  // Use refs to prevent unnecessary re-renders
  const pendingOpsRef = useRef<Operation[]>([]);
  const mountedRef = useRef(true);

  const {
    activeSession,
    userPresence,
    applyOperation,
    updateCursorPosition,
    applyBatchOperations,
  } = useStableCollaboration(projectId);

  // Memoize handlers to prevent recreation
  const handleIncomingOperation = useCallback((operation: Operation) => {
    if (!mountedRef.current) return;

    const localOps = operationalTransform.getOperationsSince(operation.timestamp - 5000);
    const transformResult = operationalTransform.transformOperation(operation, localOps);
    
    if (transformResult.priority === 'remote' || transformResult.priority === 'both') {
      setElementState(currentState => 
        operationalTransform.applyOperation(transformResult.operation, currentState)
      );
    }
  }, []);

  const handleLocalOperation = useCallback(async (operation: Omit<Operation, 'timestamp' | 'operationIndex'>) => {
    if (!mountedRef.current) return;

    const fullOperation: Operation = {
      ...operation,
      timestamp: Date.now(),
      operationIndex: pendingOpsRef.current.length,
    };

    operationalTransform.trackLocalOperation(fullOperation);
    
    setElementState(currentState => 
      operationalTransform.applyOperation(fullOperation, currentState)
    );

    if (activeSession) {
      await applyOperation({
        type: fullOperation.type,
        elementId: fullOperation.elementId,
        elementType: fullOperation.elementType,
        properties: fullOperation.data,
      });
    }
  }, [activeSession, applyOperation]);

  // Stable connection status effect
  useEffect(() => {
    setIsConnected(!!activeSession);
  }, [activeSession]);

  // Sync pending operations ref with state
  useEffect(() => {
    pendingOpsRef.current = pendingOperations;
  }, [pendingOperations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoize connection status display
  const connectionStatus = useMemo(() => (
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
  ), [isConnected, userPresence.length]);

  // Memoize conflict notification
  const conflictNotification = useMemo(() => {
    if (pendingOperations.length === 0) return null;
    
    return (
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
    );
  }, [pendingOperations.length]);

  return (
    <div className="relative h-full">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-40">
        {connectionStatus}
      </div>

      {/* Live Cursors */}
      <LiveCursors projectId={projectId} />

      {/* Collaborative BIM Editor - removed unsupported onLocalOperation prop */}
      <div className="h-full overflow-auto">
        <BIMElementsManager 
          projectId={projectId}
        />
      </div>

      {/* Conflict Resolution Notification */}
      {conflictNotification && (
        <div className="absolute bottom-4 left-4 z-40">
          {conflictNotification}
        </div>
      )}
    </div>
  );
});

StableCollaborativeEditor.displayName = 'StableCollaborativeEditor';
