import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Generated3DModel {
  id: string;
  upload_id: string;
  model_name: string;
  model_description?: string;
  model_file_path: string;
  generation_status: string;
  created_at: string;
  file_size: number;
}

interface Use3DModelViewerReturn {
  model3DUrl: string | null;
  modelMetadata: Generated3DModel | null;
  loading: boolean;
  error: string | null;
  refreshModel: () => Promise<void>;
  hasModel: boolean;
}

export const use3DModelViewer = (uploadId?: string): Use3DModelViewerReturn => {
  const [model3DUrl, setModel3DUrl] = useState<string | null>(null);
  const [modelMetadata, setModelMetadata] = useState<Generated3DModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest3DModel = useCallback(async () => {
    let effectiveUploadId = uploadId;
    
    if (!effectiveUploadId) {
      // Try to get the most recent upload if no specific uploadId
      const { data: recentUploads } = await supabase
        .from('blueprint_uploads')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!recentUploads?.length) {
        setError('No uploads found');
        return;
      }
      
      effectiveUploadId = recentUploads[0].id;
    }

    setLoading(true);
    setError(null);

    const maxAttempts = 15;
    const delay = 3000;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`[Attempt ${attempt}/${maxAttempts}] Fetching 3D model for upload:`, effectiveUploadId);
        
        // Get the latest 3D model for this upload
        // Use .maybeSingle() instead of .single() to avoid PGRST116 error when 0 rows returned
        const { data: modelData, error: modelError } = await supabase
          .from('generated_3d_models')
          .select('*')
          .eq('upload_id', effectiveUploadId)
          .eq('generation_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (modelError) {
          throw modelError;
        }

        if (modelData?.model_file_path) {
          console.log('Found 3D model:', modelData);
          setModelMetadata(modelData);

          // Check if the path is already a direct URL (blob: or http:)
          const filePath = modelData.model_file_path;
          if (filePath.startsWith('blob:') || filePath.startsWith('http')) {
            console.log('Using direct model URL:', filePath);
            setModel3DUrl(filePath);
            return; // Exit on success
          }

          // Generate signed URL for the model (for Supabase Storage paths)
          const { data: urlData, error: urlError } = await supabase.storage
            .from('3d-models')
            .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

          if (urlError) {
            throw urlError;
          }

          if (urlData?.signedUrl) {
            setModel3DUrl(urlData.signedUrl);
            console.log('Generated signed URL for 3D model');
            return; // Exit on success
          } else {
            throw new Error('Failed to generate signed URL for 3D model');
          }
        }

        // If no model found and not last attempt, wait and retry
        if (attempt < maxAttempts) {
          console.log(`No model found for upload ${effectiveUploadId}, retrying in ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // If we reach here, we exhausted retries
      setError('No 3D model found for this upload');
      console.log('Exhausted retries for upload:', effectiveUploadId);

    } catch (err) {
      console.error('Error fetching 3D model:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch 3D model');
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  const refreshModel = useCallback(async () => {
    await fetchLatest3DModel();
  }, [fetchLatest3DModel]);

  // Auto-fetch on mount and when uploadId changes
  useEffect(() => {
    fetchLatest3DModel();
  }, [fetchLatest3DModel, uploadId]);

  // Auto-refresh URL if it's about to expire (every 50 minutes)
  useEffect(() => {
    if (!model3DUrl || !modelMetadata) return;

    const refreshInterval = setInterval(() => {
      console.log('Refreshing 3D model URL to prevent expiration');
      refreshModel();
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [model3DUrl, modelMetadata, refreshModel]);

  return {
    model3DUrl,
    modelMetadata,
    loading,
    error,
    refreshModel,
    hasModel: !!model3DUrl && !!modelMetadata
  };
};