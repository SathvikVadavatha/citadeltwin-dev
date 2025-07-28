import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface UploadState {
  uploading: boolean;
  uploadProgress: number;
  processing: boolean;
  processingStep: 'upload' | 'analysis' | 'complete' | null;
  error: string | null;
}

interface UploadResult {
  id: string;
  filename: string;
  imageUrl: string;
  uploadRecord: any;
}

export const useSimplifiedUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<UploadState>({
    uploading: false,
    uploadProgress: 0,
    processing: false,
    processingStep: null,
    error: null
  });
  
  const [result, setResult] = useState<UploadResult | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload blueprints.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Reset state
      setState({
        uploading: true,
        uploadProgress: 0,
        processing: false,
        processingStep: 'upload',
        error: null
      });
      setResult(null);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Starting file upload:', fileName);
      setState(prev => ({ ...prev, uploadProgress: 25 }));

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blueprints')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setState(prev => ({ ...prev, uploadProgress: 50 }));

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('blueprints')
        .getPublicUrl(uploadData.path);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      setState(prev => ({ ...prev, uploadProgress: 75 }));

      // Insert database record
      const { data: uploadRecord, error: dbError } = await supabase
        .from('blueprint_uploads')
        .insert({
          user_id: user.id,
          filename: uploadData.path,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: uploadData.path,
          upload_status: 'uploaded'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      setState(prev => ({ 
        ...prev, 
        uploadProgress: 100,
        uploading: false,
        processing: true,
        processingStep: 'analysis'
      }));

      const uploadResult: UploadResult = {
        id: uploadRecord.id,
        filename: file.name,
        imageUrl: urlData.publicUrl,
        uploadRecord
      };

      // Start basic processing in background (non-blocking)
      try {
        await processBlueprint(uploadRecord.id, urlData.publicUrl);
        setState(prev => ({ 
          ...prev, 
          processing: false,
          processingStep: 'complete'
        }));
      } catch (processingError) {
        console.warn('Processing failed, but upload succeeded:', processingError);
        setState(prev => ({ 
          ...prev, 
          processing: false,
          processingStep: 'complete'
        }));
      }

      setResult(uploadResult);
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      });

      return uploadResult;

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setState(prev => ({ 
        ...prev, 
        uploading: false,
        processing: false,
        processingStep: null,
        error: errorMessage
      }));
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    }
  }, [user, toast]);

  const processBlueprint = async (uploadId: string, imageUrl: string) => {
    try {
      // Basic object detection - non-critical
      const { data: detectionData, error: detectionError } = await supabase.functions
        .invoke('detect-objects', {
          body: { imageUrl, uploadId }
        });

      if (detectionError) {
        console.warn('Object detection failed:', detectionError);
        return;
      }

      console.log('Object detection completed:', detectionData);
    } catch (error) {
      console.warn('Processing failed:', error);
      // Don't throw - this is non-critical
    }
  };

  const reset = useCallback(() => {
    setState({
      uploading: false,
      uploadProgress: 0,
      processing: false,
      processingStep: null,
      error: null
    });
    setResult(null);
  }, []);

  return {
    ...state,
    result,
    uploadFile,
    reset
  };
};