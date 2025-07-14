import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IfcGenerationOptions {
  buildingName?: string;
  units?: 'metric' | 'imperial';
  includeStructural?: boolean;
}

interface IfcJob {
  id: string;
  status: string;
  output_file_path?: string | null;
  error_message?: string | null;
  processing_time_ms?: number | null;
  created_at: string;
  completed_at?: string | null;
  upload_id: string;
  user_id: string;
  input_data: any;
}

export const useIfcGeneration = () => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<IfcJob | null>(null);

  const generateIfc = useCallback(async (
    uploadId: string,
    geminiData: any,
    options: IfcGenerationOptions = {}
  ) => {
    try {
      setGenerating(true);
      console.log('🚀 Starting IFC generation for upload:', uploadId);

      const { data, error } = await supabase.functions.invoke('generate-ifc', {
        body: {
          uploadId,
          geminiData,
          options: {
            buildingName: options.buildingName || 'Generated Building',
            units: options.units || 'metric',
            includeStructural: options.includeStructural !== false
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to start IFC generation');
      }

      if (!data.success) {
        throw new Error(data.error || 'IFC generation failed');
      }

      // Job will be updated by polling, just set generating state
      setCurrentJob(null);

      toast({
        title: "IFC Generation Started",
        description: "Your 3D model is being generated. This may take a few minutes.",
      });

      // Start polling for job status
      pollJobStatus(data.jobId);

      return data.jobId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "IFC generation failed";
      
      console.error('💥 IFC generation error:', error);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setGenerating(false);
    }
  }, [toast]);

  const pollJobStatus = useCallback(async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('ifc_generation_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Error polling job status:', error);
          return;
        }

        setCurrentJob(data);

        if (data.status === 'completed') {
          toast({
            title: "IFC Generation Complete",
            description: "Your 3D model has been generated successfully!",
          });
          return;
        }

        if (data.status === 'failed') {
          toast({
            title: "Generation Failed",
            description: data.error_message || "IFC generation failed",
            variant: "destructive",
          });
          return;
        }

        // Continue polling if still processing
        if (data.status === 'processing' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else if (attempts >= maxAttempts) {
          toast({
            title: "Generation Timeout",
            description: "IFC generation is taking longer than expected",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    };

    poll();
  }, [toast]);

  const downloadIfc = useCallback(async (job: IfcJob) => {
    if (!job.output_file_path) {
      toast({
        title: "Download Failed",
        description: "No file available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('ifc-models')
        .download(job.output_file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `building_model_${job.id.slice(0, 8)}.ifc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Your IFC file is downloading",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the IFC file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getIfcJobs = useCallback(async (uploadId?: string) => {
    try {
      let query = supabase
        .from('ifc_generation_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (uploadId) {
        query = query.eq('upload_id', uploadId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching IFC jobs:', error);
      return [];
    }
  }, []);

  return {
    generating,
    currentJob,
    generateIfc,
    downloadIfc,
    getIfcJobs,
    pollJobStatus
  };
};