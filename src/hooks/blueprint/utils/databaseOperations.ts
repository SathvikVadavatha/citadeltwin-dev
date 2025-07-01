
import { supabase } from "@/integrations/supabase/client";
import { DetectedObject } from '../types/processingTypes';
import { logger } from '@/utils/logger';

export const updateUploadStatus = async (uploadId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('blueprint_uploads')
      .update({ status })
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
    const { error } = await supabase
      .from('blueprint_uploads')
      .update({
        detected_objects: detectedObjects,
        processing_method: isAIGenerated ? 'ai' : 'fallback',
        error_message: errorMessage
      })
      .eq('id', uploadId);
    
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
    const { error } = await supabase
      .from('blueprint_uploads')
      .update({
        processing_metadata: metadata
      })
      .eq('id', uploadId);
    
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
