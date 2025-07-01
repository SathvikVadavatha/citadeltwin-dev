
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';
import { Plan2SceneResult } from '../types/processingTypes';
import { convertImageToBase64 } from './imageProcessing';

export const performPlan2SceneHealthCheck = async (uploadId: string): Promise<boolean> => {
  let healthCheckSuccess = false;
  let healthCheckAttempts = 0;
  const maxHealthCheckAttempts = 2;
  
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
          capabilities: healthCheck.capabilities,
          status: healthCheck.status
        });
      } else {
        throw new Error(`Health check unsuccessful: ${JSON.stringify(healthCheck)}`);
      }
    } catch (error) {
      logger.warn(`Health check attempt ${healthCheckAttempts} failed`, 'Plan2Scene', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      if (healthCheckAttempts >= maxHealthCheckAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return healthCheckSuccess;
};

export const callPlan2SceneProcessor = async (imageUrl: string, uploadId: string): Promise<Plan2SceneResult> => {
  logger.info('🖼️ Starting Plan2Scene image processing', 'Plan2Scene', { uploadId });
  
  try {
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
    
    // Call Plan2Scene edge function with enhanced error handling
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
      responseKeys: plan2sceneResult ? Object.keys(plan2sceneResult) : []
    });

    if (plan2sceneError) {
      logger.error('❌ Plan2Scene edge function error', 'Plan2Scene', {
        error: plan2sceneError.message,
        details: plan2sceneError
      });
      throw new Error(`Plan2Scene edge function error: ${plan2sceneError.message}`);
    }

    if (!plan2sceneResult) {
      logger.error('❌ No response received from Plan2Scene', 'Plan2Scene');
      throw new Error('No response received from Plan2Scene edge function');
    }

    // Enhanced response validation
    if (plan2sceneResult.success === false) {
      const errorMsg = plan2sceneResult.error || 'Plan2Scene processing failed';
      logger.error('❌ Plan2Scene processing unsuccessful', 'Plan2Scene', {
        error: errorMsg,
        errorType: plan2sceneResult.errorType,
        errorDetails: plan2sceneResult.errorDetails
      });
      throw new Error(errorMsg);
    }

    // Validate that we have a valid success response
    if (plan2sceneResult.success !== true) {
      logger.warn('⚠️ Plan2Scene response missing explicit success flag', 'Plan2Scene', {
        success: plan2sceneResult.success,
        hasRooms: !!plan2sceneResult.rooms,
        hasWalls: !!plan2sceneResult.walls,
        hasElements: !!plan2sceneResult.elements
      });
      
      // If we have actual data but no explicit success flag, treat as successful
      if (plan2sceneResult.rooms || plan2sceneResult.walls || plan2sceneResult.elements) {
        plan2sceneResult.success = true;
        logger.info('✅ Treating response as successful due to presence of data', 'Plan2Scene');
      } else {
        throw new Error('Plan2Scene returned no data and no explicit success flag');
      }
    }

    // Log the successful result structure
    logger.info('✅ Plan2Scene processing successful', 'Plan2Scene', {
      roomCount: plan2sceneResult.rooms?.length || 0,
      wallCount: plan2sceneResult.walls?.length || 0,
      elementCount: plan2sceneResult.elements?.length || 0,
      hasQualityMetrics: !!plan2sceneResult.qualityMetrics,
      hasProcessingStats: !!plan2sceneResult.processingStats,
      modelId: plan2sceneResult.modelId,
      modelUrl: plan2sceneResult.modelUrl
    });

    return plan2sceneResult;
    
  } catch (error) {
    logger.error('💥 Plan2Scene processing failed', 'Plan2Scene', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined,
      uploadId
    });
    throw error;
  }
};
