
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';
import { Plan2SceneResult } from '../types/processingTypes';
import { convertImageToBase64 } from './imageProcessing';

export const performPlan2SceneHealthCheck = async (uploadId: string): Promise<boolean> => {
  let healthCheckSuccess = false;
  let healthCheckAttempts = 0;
  const maxHealthCheckAttempts = 2; // Reduced attempts for faster processing
  
  while (!healthCheckSuccess && healthCheckAttempts < maxHealthCheckAttempts) {
    healthCheckAttempts++;
    logger.debug(`Health check attempt ${healthCheckAttempts}/${maxHealthCheckAttempts}`, 'Plan2Scene');
    
    try {
      const { data: healthCheck, error: healthError } = await supabase.functions.invoke('plan2scene-processor', {
        body: { test: true, uploadId: uploadId }
      });
      
      if (healthError) {
        throw new Error(`Health check failed: ${healthError.message}`);
      }
      
      if (healthCheck?.success) {
        healthCheckSuccess = true;
        logger.info('✅ Plan2Scene health check passed', 'Plan2Scene', {
          version: healthCheck.version,
          capabilities: healthCheck.capabilities
        });
      } else {
        throw new Error(`Health check unsuccessful: ${JSON.stringify(healthCheck)}`);
      }
    } catch (error) {
      logger.warn(`Health check attempt ${healthCheckAttempts} failed`, 'Plan2Scene', { 
        error: error.message 
      });
      if (healthCheckAttempts >= maxHealthCheckAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Shorter wait
    }
  }
  
  return healthCheckSuccess;
};

export const callPlan2SceneProcessor = async (imageUrl: string, uploadId: string): Promise<Plan2SceneResult> => {
  logger.info('🖼️ Starting Plan2Scene image processing', 'Plan2Scene', { uploadId });
  
  // Convert image to base64
  const imageBase64 = await convertImageToBase64(imageUrl);
  
  if (!imageBase64 || imageBase64.length < 100) {
    throw new Error(`Image conversion failed: invalid result (length: ${imageBase64?.length || 0})`);
  }
  
  // Clean base64 data
  const cleanImageData = imageBase64.startsWith('data:') ? 
    imageBase64.split(',')[1] : imageBase64;
  
  if (!cleanImageData || cleanImageData.length < 50) {
    throw new Error(`Invalid base64 data after cleaning (length: ${cleanImageData?.length || 0})`);
  }
  
  logger.info('📤 Calling Plan2Scene processor', 'Plan2Scene', {
    payloadSize: cleanImageData.length,
    uploadId
  });
  
  // Call Plan2Scene edge function
  const { data: plan2sceneResult, error: plan2sceneError } = await supabase.functions.invoke('plan2scene-processor', {
    body: {
      imageData: cleanImageData,
      uploadId: uploadId,
      debug: true
    }
  });

  logger.info('📥 Plan2Scene response received', 'Plan2Scene', { 
    hasData: !!plan2sceneResult, 
    hasError: !!plan2sceneError,
    success: plan2sceneResult?.success
  });

  if (plan2sceneError) {
    throw new Error(`Plan2Scene edge function error: ${plan2sceneError.message}`);
  }

  if (!plan2sceneResult) {
    throw new Error('No response received from Plan2Scene edge function');
  }

  if (!plan2sceneResult.success) {
    const errorMsg = plan2sceneResult.error || 'Plan2Scene processing failed';
    logger.error('❌ Plan2Scene processing unsuccessful', 'Plan2Scene', {
      error: errorMsg,
      errorType: plan2sceneResult.errorType
    });
    throw new Error(errorMsg);
  }

  // Log the successful result structure
  logger.info('✅ Plan2Scene processing successful', 'Plan2Scene', {
    roomCount: plan2sceneResult.rooms?.length || 0,
    wallCount: plan2sceneResult.walls?.length || 0,
    elementCount: plan2sceneResult.elements?.length || 0,
    hasQualityMetrics: !!plan2sceneResult.qualityMetrics
  });

  return plan2sceneResult;
};
