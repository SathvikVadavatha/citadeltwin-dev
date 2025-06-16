
import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';

export const useUploads = (userId?: string) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadBlueprint = useCallback(async (file: File, projectId: string) => {
    if (!userId) {
      setUploadError('User ID is required to upload.');
      return false;
    }

    setUploading(true);
    setUploadError(null);

    const fileName = `${userId}-${Date.now()}-${file.name}`;
    const filePath = `blueprints/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('blueprints')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('File upload error:', error);
        setUploadError(`File upload failed: ${error.message}`);
        return false;
      }

      const imageUrl = `https://fjybggorcizszcpedjbb.supabase.co/storage/v1/object/public/${data.path}`;

      // Save upload details to the database - using correct field names
      const { error: dbError } = await supabase
        .from('blueprint_uploads')
        .insert({
          user_id: userId,
          project_id: projectId,
          filename: file.name, // Updated from file_name to filename
          original_filename: file.name,
          storage_path: filePath, // Updated from file_path to storage_path
          file_type: file.type,
          file_size: file.size,
          upload_status: 'uploaded',
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        setUploadError(`Database save failed: ${dbError.message}`);
        return false;
      }

      console.log('Blueprint uploaded successfully:', data);
      return true;

    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(`Upload failed: ${err}`);
      return false;
    } finally {
      setUploading(false);
    }
  }, [userId, supabase]);

  const { data: uploads, isLoading, error, refetch } = useOptimizedQuery({
    queryKey: `uploads-${userId}`,
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('blueprint_uploads')
        .select(`
          *,
          detection_results (
            id,
            detected_objects,
            processing_time_ms,
            model_used,
            confidence_threshold
          ),
          generated_3d_models (
            id,
            model_name,
            model_file_path,
            generation_status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    cacheTime: 300000, // 5 minutes cache
    enabled: !!userId
  });

  const deleteUpload = useCallback(async (uploadId: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('blueprint_uploads')
        .delete()
        .eq('id', uploadId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        return false;
      }

      // Refresh uploads
      refetch();
      return true;
    } catch (err) {
      console.error('Delete error:', err);
      return false;
    }
  }, [supabase, refetch]);

  return {
    uploads: uploads || [],
    isLoading,
    error,
    refetch,
    uploadBlueprint,
    uploading,
    uploadError,
    deleteUpload
  };
};
