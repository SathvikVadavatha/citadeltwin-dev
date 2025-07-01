
import { supabase } from "@/integrations/supabase/client";
import { DetectedObject } from '../types/processingTypes';
import { logger } from '@/utils/logger';

export const updateUploadStatus = async (uploadId: string, status: string) => {
  try {
    logger.debug('Updating upload status', 'Database', { uploadId, status });
    
    const { error } = await supabase
      .from('blueprint_uploads')
      .update({ upload_status: status })
      .eq('id', uploadId);
    
    if (error) {
      logger.error('Failed to update upload status', 'Database', { 
        uploadId, 
        status, 
        error: error.message,
        code: error.code 
      });
      // Don't throw error - allow processing to continue
      return false;
    }
    
    logger.debug('Upload status updated successfully', 'Database', { uploadId, status });
    return true;
  } catch (error) {
    logger.error('Exception in updateUploadStatus', 'Database', { 
      uploadId, 
      status, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Don't throw error - allow processing to continue
    return false;
  }
};

export const storeDetectionResults = async (
  uploadId: string, 
  detectedObjects: DetectedObject[], 
  isAIGenerated: boolean, 
  errorMessage?: string
) => {
  try {
    logger.debug('Storing detection results', 'Database', {
      uploadId,
      objectCount: detectedObjects.length,
      isAIGenerated
    });

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
    
    if (error) {
      logger.error('Failed to store detection results', 'Database', {
        uploadId,
        error: error.message,
        code: error.code
      });
      throw error;
    }
    
    logger.debug('Detection results stored successfully', 'Database', {
      uploadId,
      objectCount: detectedObjects.length,
      isAIGenerated
    });
    return true;
  } catch (error) {
    logger.error('Exception in storeDetectionResults', 'Database', {
      uploadId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

export const storeProcessingMetadata = async (uploadId: string, metadata: any) => {
  try {
    logger.debug('Storing processing metadata', 'Database', { uploadId });

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
    
    if (error) {
      logger.error('Failed to store processing metadata', 'Database', {
        uploadId,
        error: error.message,
        code: error.code
      });
      // Don't throw error - metadata is not critical
      return false;
    }
    
    logger.debug('Processing metadata stored successfully', 'Database', { uploadId });
    return true;
  } catch (error) {
    logger.error('Exception in storeProcessingMetadata', 'Database', {
      uploadId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Don't throw error - metadata is not critical
    return false;
  }
};
