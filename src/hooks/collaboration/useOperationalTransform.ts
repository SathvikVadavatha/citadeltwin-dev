
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { operationalTransform } from '@/components/collaboration/OperationalTransform';

export interface OperationData {
  type: 'create' | 'update' | 'delete' | 'transform';
  elementId?: string;
  elementType?: string;
  properties?: any;
  oldProperties?: any;
  position?: any;
  [key: string]: any;
}

export const useOperationalTransform = (sessionId?: string) => {
  const [operationIndex, setOperationIndex] = useState(0);
  const { user } = useAuth();

  const applyOperation = useCallback(async (operation: OperationData) => {
    if (!user || !sessionId) return;

    try {
      const currentIndex = operationIndex;
      setOperationIndex(prev => prev + 1);

      const { error } = await supabase
        .from('collaboration_changes')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          change_type: operation.type,
          element_id: operation.elementId,
          element_type: operation.elementType,
          operation_data: operation as any,
          operation_index: currentIndex,
        });

      if (error) {
        console.error('Error applying operation:', error);
        toast.error('Failed to apply changes');
        return;
      }
    } catch (error) {
      console.error('Error applying operation:', error);
      toast.error('Failed to apply changes');
    }
  }, [user, sessionId, operationIndex]);

  const handleIncomingChange = useCallback((change: any) => {
    console.log('Incoming change:', change);
    toast.info(`${change.change_type} operation received from another user`);
  }, []);

  return {
    applyOperation,
    handleIncomingChange,
    operationIndex,
  };
};
