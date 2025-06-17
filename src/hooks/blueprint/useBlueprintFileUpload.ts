
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

interface UploadProgress {
  uploading: boolean;
  uploadProgress: number;
}

export const useBlueprintFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadState, setUploadState] = useState<UploadProgress>({
    uploading: false,
    uploadProgress: 0
  });

  const uploadFile = useCallback(async (file: File) => {
    if (!user) return null;

    try {
      setUploadState({ uploading: true, uploadProgress: 0 });

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blueprints')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadState(prev => ({ ...prev, uploadProgress: 50 }));

      const { data: urlData } = supabase.storage
        .from('blueprints')
        .getPublicUrl(fileName);

      setUploadState(prev => ({ ...prev, uploadProgress: 75 }));

      const { data: uploadRecord, error: dbError } = await supabase
        .from('blueprint_uploads')
        .insert({
          user_id: user.id,
          filename: fileName,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: uploadData.path,
          upload_status: 'uploaded'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadState(prev => ({ ...prev, uploadProgress: 100 }));
      
      return {
        uploadRecord,
        publicUrl: urlData.publicUrl
      };

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadState({ uploading: false, uploadProgress: 0 });
    }
  }, [user, toast]);

  return {
    ...uploadState,
    uploadFile
  };
};
