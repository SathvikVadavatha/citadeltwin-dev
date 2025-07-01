
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
    }
  } catch (error) {
    console.warn('Database update failed:', error);
  }
};

export const storeDetectionResults = async (uploadId: string, detectedObjects: DetectedObject[]) => {
  try {
    const { error } = await supabase
      .from('detection_results')
      .insert({
        upload_id: uploadId,
        detected_objects: detectedObjects as any,
        processing_time_ms: 5000,
        model_used: 'gemini-pro-vision',
        confidence_threshold: 0.7
      });

    if (error) {
      console.error('Failed to store detection results:', error);
    }
  } catch (error) {
    console.error('Error storing detection results:', error);
  }
};
