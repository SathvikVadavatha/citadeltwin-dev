
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useEdgeFunctions = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const executeMultiJurisdictionCompliance = async (
    uploadId: string, 
    jurisdictions: string[]
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-jurisdiction-compliance', {
        body: {
          upload_id: uploadId,
          jurisdictions,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast.success('Multi-jurisdiction compliance check started');
      return data;
    } catch (error) {
      console.error('Error starting compliance check:', error);
      toast.error('Failed to start compliance check');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = async (
    uploadId: string,
    templateId: string,
    documentType: string,
    variables?: Record<string, any>
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('automated-document-generation', {
        body: {
          upload_id: uploadId,
          template_id: templateId,
          document_type: documentType,
          variables: variables || {},
          user_id: user.id
        }
      });

      if (error) throw error;

      toast.success('Document generation started');
      return data;
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('Failed to generate document');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const executeFEAAnalysis = async (analysisId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fea-analysis-execution', {
        body: {
          analysis_id: analysisId,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast.success('FEA analysis started');
      return data;
    } catch (error) {
      console.error('Error executing FEA analysis:', error);
      toast.error('Failed to execute FEA analysis');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateGISData = async (layerId: string, updateType: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('realtime-gis-integration', {
        body: {
          layer_id: layerId,
          update_type: updateType,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast.success('GIS data update started');
      return data;
    } catch (error) {
      console.error('Error updating GIS data:', error);
      toast.error('Failed to update GIS data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    executeMultiJurisdictionCompliance,
    generateDocument,
    executeFEAAnalysis,
    updateGISData,
  };
};
