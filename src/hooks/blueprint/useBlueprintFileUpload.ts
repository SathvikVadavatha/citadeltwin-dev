
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
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload blueprints.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setUploadState({ uploading: true, uploadProgress: 0 });

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Starting file upload:', fileName);
      setUploadState(prev => ({ ...prev, uploadProgress: 25 }));

      // Upload to the blueprints bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blueprints')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully:', uploadData);
      setUploadState(prev => ({ ...prev, uploadProgress: 50 }));

      // Get the public URL for the uploaded file - using the correct method
      const { data: urlData } = supabase.storage
        .from('blueprints')
        .getPublicUrl(uploadData.path);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log('Public URL generated:', urlData.publicUrl);
      setUploadState(prev => ({ ...prev, uploadProgress: 75 }));

      // Test the URL accessibility before proceeding
      try {
        const testResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
        if (!testResponse.ok) {
          console.warn('URL accessibility test failed:', testResponse.status);
        }
      } catch (testError) {
        console.warn('URL test failed, but continuing:', testError);
      }

      // Insert record into database
      const { data: uploadRecord, error: dbError } = await supabase
        .from('blueprint_uploads')
        .insert({
          user_id: user.id,
          filename: uploadData.path, // Use the storage path as filename
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: uploadData.path,
          upload_status: 'uploaded'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      setUploadState(prev => ({ ...prev, uploadProgress: 100 }));
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded and is ready for processing.`,
      });

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
