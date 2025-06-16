
import { useCallback } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { toast } from 'sonner';

interface DocumentRealtimeHooks {
  refreshExports: () => void;
}

export const useDocumentRealtime = ({ refreshExports }: DocumentRealtimeHooks) => {
  const handleExportUpdate = useCallback((payload: any) => {
    const exportDoc = payload.new;
    switch (exportDoc.status) {
      case 'generating':
        toast.info('Document generation started');
        break;
      case 'completed':
        toast.success('Document generated successfully');
        break;
      case 'failed':
        toast.error('Document generation failed');
        break;
    }
    refreshExports();
  }, [refreshExports]);

  useRealtimeUpdates([
    {
      table: 'document_exports',
      onUpdate: handleExportUpdate,
    }
  ]);
};
