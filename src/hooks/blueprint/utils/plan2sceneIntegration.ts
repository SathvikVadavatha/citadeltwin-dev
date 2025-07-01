
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';
import { Plan2SceneResult } from '../types/processingTypes';
import { convertImageToBase64 } from './imageProcessing';

export const performPlan2SceneHealthCheck = async (uploadId: string): Promise<boolean> => {
  let healthCheckSuccess = false;
  let healthCheckAttempts = 0;
  const maxHealthCheckAttempts = 3;
  
  while (!healthCheckSuccess && healthCheckAttempts < maxHealthCheckAttempts) {
    healthCheckAttempts++;
    logger.debug(`Health check attempt ${healthCheckAttempts}/${maxHealthCheckAttempts}`, 'Plan2Scene');
    
    try {
      const { data: healthCheck, error: healthError } = await supabase.functions.invoke('plan2scene-processor', {
        body: { test: true, uploadId: uploadId }
      });
      
      logger.debug('Health check response received', 'Plan2Scene', {
        attempt: healthCheckAttempts,
        hasData: !!healthCheck,
        hasError: !!healthError,
        success: healthCheck?.success
      });
      
      if (healthError) {
        throw new Error(`Health check failed (attempt ${healthCheckAttempts}): ${healthError.message}`);
      }
      
      if (healthCheck?.success) {
        healthCheckSuccess = true;
        logger.info('✅ Health check successful', 'Plan2Scene', {
          version: healthCheck.version,
          capabilities: healthCheck.capabilities
        });
      } else {
        throw new Error(`Health check returned unsuccessful result: ${JSON.stringify(healthCheck)}`);
      }
    } catch (error) {
      logger.warn(`Health check attempt ${healthCheckAttempts} failed`, 'Plan2Scene', { error: error.message });
      if (healthCheckAttempts >= maxHealthCheckAttempts) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * healthCheckAttempts));
    }
  }
  
  return healthCheckSuccess;
};

export const callPlan2SceneProcessor = async (imageUrl: string, uploadId: string): Promise<Plan2SceneResult> => {
  // Enhanced image conversion with validation
  logger.info('🖼️ Converting image to base64 with enhanced validation', 'Plan2Scene');
  const imageBase64 = await convertImageToBase64(imageUrl);
  
  if (!imageBase64 || imageBase64.length < 100) {
    throw new Error(`Image conversion failed: invalid result (length: ${imageBase64?.length || 0})`);
  }
  
  // Enhanced base64 validation
  const cleanImageData = imageBase64.startsWith('data:') ? 
    imageBase64.split(',')[1] : imageBase64;
  
  if (!cleanImageData || cleanImageData.length < 50) {
    throw new Error(`Invalid base64 data after cleaning (length: ${cleanImageData?.length || 0})`);
  }
  
  // Validate base64 format
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cleanImageData)) {
    throw new Error('Base64 data contains invalid characters');
  }
  
  logger.info('✅ Image conversion successful', 'Plan2Scene', {
    originalLength: imageBase64.length,
    cleanedLength: cleanImageData.length,
    sampleStart: cleanImageData.substring(0, 20),
    sampleEnd: cleanImageData.substring(Math.max(0, cleanImageData.length - 20))
  });
  
  // Enhanced Plan2Scene API call with detailed logging
  logger.info('📤 Calling enhanced Plan2Scene processor', 'Plan2Scene', {
    payloadSize: cleanImageData.length,
    uploadId
  });
  
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
    success: plan2sceneResult?.success,
    errorType: plan2sceneResult?.errorType
  });

  if (plan2sceneError) {
    throw new Error(`Plan2Scene edge function error: ${plan2sceneError.message}`);
  }

  if (!plan2sceneResult) {
    throw new Error('No response received from Plan2Scene edge function');
  }

  if (!plan2sceneResult.success) {
    const errorMsg = plan2sceneResult.error || plan2sceneResult.errorDetails?.originalError || 'Plan2Scene processing failed';
    logger.error('Plan2Scene processing unsuccessful', 'Plan2Scene', {
      error: errorMsg,
      errorType: plan2sceneResult.errorType,
      errorDetails: plan2sceneResult.errorDetails
    });
    throw new Error(errorMsg);
  }

  return plan2sceneResult;
};
