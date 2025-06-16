
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

interface ProcessingStatus {
  type: 'blueprint' | 'compliance' | 'fea' | 'document' | 'gis';
  id: string;
  status: string;
  progress?: number;
  message?: string;
}

export const useRealTimeProcessing = () => {
  const [processingStatuses, setProcessingStatuses] = useState<ProcessingStatus[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen to blueprint uploads
    const blueprintChannel = supabase
      .channel('blueprint-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blueprint_uploads',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Blueprint update:', payload);
          handleBlueprintUpdate(payload);
        }
      );

    // Listen to compliance checks
    const complianceChannel = supabase
      .channel('compliance-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_checks'
        },
        (payload) => {
          console.log('Compliance update:', payload);
          handleComplianceUpdate(payload);
        }
      );

    // Listen to FEA analyses
    const feaChannel = supabase
      .channel('fea-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fea_analyses',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('FEA update:', payload);
          handleFEAUpdate(payload);
        }
      );

    // Listen to document exports
    const documentChannel = supabase
      .channel('document-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_exports',
          filter: `generated_by=eq.${user.id}`
        },
        (payload) => {
          console.log('Document update:', payload);
          handleDocumentUpdate(payload);
        }
      );

    // Listen to GIS updates
    const gisChannel = supabase
      .channel('gis-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gis_data_updates'
        },
        (payload) => {
          console.log('GIS update:', payload);
          handleGISUpdate(payload);
        }
      );

    // Subscribe to all channels
    blueprintChannel.subscribe();
    complianceChannel.subscribe();
    feaChannel.subscribe();
    documentChannel.subscribe();
    gisChannel.subscribe();

    return () => {
      supabase.removeChannel(blueprintChannel);
      supabase.removeChannel(complianceChannel);
      supabase.removeChannel(feaChannel);
      supabase.removeChannel(documentChannel);
      supabase.removeChannel(gisChannel);
    };
  }, [user]);

  const handleBlueprintUpdate = (payload: any) => {
    const record = payload.new || payload.old;
    
    setProcessingStatuses(prev => {
      const filtered = prev.filter(p => !(p.type === 'blueprint' && p.id === record.id));
      
      if (payload.eventType === 'DELETE') {
        return filtered;
      }

      return [...filtered, {
        type: 'blueprint',
        id: record.id,
        status: record.upload_status,
        message: `Blueprint ${record.original_filename}: ${record.upload_status}`
      }];
    });

    // Show toast notifications for important status changes
    if (record.upload_status === 'completed') {
      toast.success(`Blueprint processed: ${record.original_filename}`);
    } else if (record.upload_status === 'failed') {
      toast.error(`Blueprint processing failed: ${record.original_filename}`);
    }
  };

  const handleComplianceUpdate = (payload: any) => {
    const record = payload.new || payload.old;
    
    setProcessingStatuses(prev => {
      const filtered = prev.filter(p => !(p.type === 'compliance' && p.id === record.id));
      
      if (payload.eventType === 'DELETE') {
        return filtered;
      }

      const progress = record.rules_checked && record.metadata?.total 
        ? Math.round((record.rules_checked / record.metadata.total) * 100)
        : 0;

      return [...filtered, {
        type: 'compliance',
        id: record.id,
        status: record.status,
        progress,
        message: `Compliance check: ${record.status} (${record.violations_found || 0} violations)`
      }];
    });

    if (record.status === 'completed') {
      const violationCount = record.violations_found || 0;
      if (violationCount === 0) {
        toast.success('Compliance check completed - No violations found!');
      } else {
        toast.warning(`Compliance check completed - ${violationCount} violations found`);
      }
    }
  };

  const handleFEAUpdate = (payload: any) => {
    const record = payload.new || payload.old;
    
    setProcessingStatuses(prev => {
      const filtered = prev.filter(p => !(p.type === 'fea' && p.id === record.id));
      
      if (payload.eventType === 'DELETE') {
        return filtered;
      }

      return [...filtered, {
        type: 'fea',
        id: record.id,
        status: record.status,
        message: `FEA Analysis (${record.analysis_type}): ${record.status}`
      }];
    });

    if (record.status === 'completed') {
      toast.success(`FEA Analysis completed: ${record.name}`);
    } else if (record.status === 'failed') {
      toast.error(`FEA Analysis failed: ${record.name}`);
    }
  };

  const handleDocumentUpdate = (payload: any) => {
    const record = payload.new || payload.old;
    
    setProcessingStatuses(prev => {
      const filtered = prev.filter(p => !(p.type === 'document' && p.id === record.id));
      
      if (payload.eventType === 'DELETE') {
        return filtered;
      }

      return [...filtered, {
        type: 'document',
        id: record.id,
        status: record.status,
        message: `Document (${record.document_type}): ${record.status}`
      }];
    });

    if (record.status === 'completed') {
      toast.success(`Document generated: ${record.title}`);
    } else if (record.status === 'failed') {
      toast.error(`Document generation failed: ${record.title}`);
    }
  };

  const handleGISUpdate = (payload: any) => {
    const record = payload.new || payload.old;
    
    setProcessingStatuses(prev => {
      const filtered = prev.filter(p => !(p.type === 'gis' && p.id === record.id));
      
      if (payload.eventType === 'DELETE') {
        return filtered;
      }

      return [...filtered, {
        type: 'gis',
        id: record.id,
        status: record.processing_status,
        message: `GIS Data (${record.update_type}): ${record.processing_status}`
      }];
    });

    if (record.processing_status === 'completed') {
      toast.success('GIS data updated successfully');
    }
  };

  const clearProcessingStatus = (type: string, id: string) => {
    setProcessingStatuses(prev => 
      prev.filter(p => !(p.type === type && p.id === id))
    );
  };

  const clearAllProcessingStatuses = () => {
    setProcessingStatuses([]);
  };

  return {
    processingStatuses,
    clearProcessingStatus,
    clearAllProcessingStatuses
  };
};
