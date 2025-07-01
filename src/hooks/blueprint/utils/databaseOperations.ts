
import { supabase } from "@/integrations/supabase/client";

interface DetectedObject {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const updateUploadStatus = async (uploadId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('blueprint_uploads')
      .update({ upload_status: status })
      .eq('id', uploadId);

    if (error) {
      console.warn('Could not update upload status:', error);
    } else {
      console.log(`Upload ${uploadId} status updated to: ${status}`);
    }
  } catch (error) {
    console.warn('Database update failed:', error);
  }
};

export const storeDetectionResults = async (
  uploadId: string, 
  detectedObjects: DetectedObject[], 
  isAIGenerated: boolean = true,
  processingError?: string
) => {
  try {
    const { error } = await supabase
      .from('detection_results')
      .insert({
        upload_id: uploadId,
        detected_objects: detectedObjects as any,
        processing_time_ms: 5000,
        model_used: isAIGenerated ? 'gemini-pro-vision' : 'mock-fallback',
        confidence_threshold: 0.7,
        metadata: {
          is_ai_generated: isAIGenerated,
          processing_error: processingError,
          fallback_reason: isAIGenerated ? null : 'AI processing failed',
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Failed to store detection results:', error);
    } else {
      console.log(`Detection results stored for upload ${uploadId}`, {
        objectCount: detectedObjects.length,
        isAIGenerated,
        hasError: !!processingError
      });
    }
  } catch (error) {
    console.error('Error storing detection results:', error);
  }
};

export const getDetectionResults = async (uploadId: string) => {
  try {
    const { data, error } = await supabase
      .from('detection_results')
      .select('*')
      .eq('upload_id', uploadId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Failed to get detection results:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting detection results:', error);
    return null;
  }
};

export const storeProcessingMetadata = async (
  uploadId: string,
  metadata: {
    processingMethod: 'ai' | 'fallback';
    errorMessage?: string;
    imageCharacteristics?: any;
    processingTimeMs?: number;
  }
) => {
  try {
    const { error } = await supabase
      .from('blueprint_uploads')
      .update({ 
        upload_status: metadata.processingMethod === 'ai' ? 'processed' : 'processed_fallback'
      })
      .eq('id', uploadId);

    if (error) {
      console.warn('Could not update processing metadata:', error);
    }
  } catch (error) {
    console.warn('Failed to store processing metadata:', error);
  }
};
