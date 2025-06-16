
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export const useFEAExecution = () => {
  const [running, setRunning] = useState(false);
  const { user } = useAuth();

  const getJsonValue = useCallback((json: any, path: string, defaultValue: any = null) => {
    try {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return json?.[path] ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }, []);

  const runAnalysis = useCallback(async (analysisId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setRunning(true);

      const { data: analysis, error: analysisError } = await supabase
        .from('fea_analyses')
        .select(`
          *,
          bim_elements (
            id,
            name,
            geometry,
            materials (
              id,
              name,
              properties
            )
          )
        `)
        .eq('id', analysisId)
        .single();

      if (analysisError) throw analysisError;

      const [loadsResult, bcResult] = await Promise.all([
        supabase.from('fea_loads').select('*').eq('analysis_id', analysisId),
        supabase.from('fea_boundary_conditions').select('*').eq('analysis_id', analysisId)
      ]);

      if (loadsResult.error) throw loadsResult.error;
      if (bcResult.error) throw bcResult.error;

      const response = await supabase.functions.invoke('fea-analysis', {
        body: {
          analysisId,
          geometry: analysis.bim_elements?.geometry || {},
          material: analysis.bim_elements?.materials || {},
          loads: loadsResult.data || [],
          boundaryConditions: bcResult.data || [],
          meshSettings: getJsonValue(analysis.input_parameters, 'mesh', {})
        }
      });

      if (response.error) {
        console.error('FEA analysis error:', response.error);
        toast.error('FEA analysis failed');
        return false;
      }

      toast.success('FEA analysis completed successfully');
      return true;

    } catch (error) {
      console.error('Error running FEA analysis:', error);
      toast.error('Failed to run FEA analysis');
      return false;
    } finally {
      setRunning(false);
    }
  }, [user, getJsonValue]);

  return {
    running,
    runAnalysis,
  };
};
