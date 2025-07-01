
import { supabase } from "@/integrations/supabase/client";
import { DetectedObject } from '../types/processingTypes';
import { logger } from '@/utils/logger';

export const updateUploadStatus = async (uploadId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('blueprint_uploads')
      .update({ upload_status: status })
      .eq('id', uploadId);
    
    if (error) throw error;
    
    logger.debug('Upload status updated', 'Database', { uploadId, status });
  } catch (error) {
    logger.error('Failed to update upload status', 'Database', { 
      uploadId, 
      status, 
      error: error.message 
    });
    throw error;
  }
};

export const storeDetectionResults = async (
  uploadId: string, 
  detectedObjects: DetectedObject[], 
  isAIGenerated: boolean, 
  errorMessage?: string
) => {
  try {
    // Convert DetectedObject[] to JSON-compatible format
    const detectedObjectsJson = JSON.parse(JSON.stringify(detectedObjects));
    
    // Store detection results in the dedicated table
    const { error } = await supabase
      .from('detection_results')
      .insert({
        upload_id: uploadId,
        detected_objects: detectedObjectsJson,
        processing_method: isAIGenerated ? 'ai' : 'fallback',
        is_ai_generated: isAIGenerated,
        error_message: errorMessage,
        confidence_threshold: 0.5,
        processing_time_ms: 5000
      });
    
    if (error) throw error;
    
    logger.debug('Detection results stored', 'Database', {
      uploadId,
      objectCount: detectedObjects.length,
      isAIGenerated
    });
  } catch (error) {
    logger.error('Failed to store detection results', 'Database', {
      uploadId,
      error: error.message
    });
    throw error;
  }
};

export const storeProcessingMetadata = async (uploadId: string, metadata: any) => {
  try {
    // Convert metadata to JSON-compatible format
    const metadataJson = JSON.parse(JSON.stringify(metadata));
    
    // Update the existing detection result with metadata
    const { error } = await supabase
      .from('detection_results')
      .update({
        metadata: metadataJson
      })
      .eq('upload_id', uploadId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    logger.debug('Processing metadata stored', 'Database', { uploadId });
  } catch (error) {
    logger.error('Failed to store processing metadata', 'Database', {
      uploadId,
      error: error.message
    });
    throw error;
  }
};
