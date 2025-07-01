
import { logger } from '@/utils/logger';
import { DetectedObject } from '../types/processingTypes';
import { generateMockDetectionResults } from './mockDataGenerator';

export interface ProcessingError {
  type: 'plan2scene_failure' | 'conversion_failure' | 'general_error';
  message: string;
  originalError?: Error;
}

export const createProcessingError = (type: ProcessingError['type'], message: string, originalError?: Error): ProcessingError => {
  return {
    type,
    message,
    originalError
  };
};

export const handleProcessingError = (
  error: ProcessingError | Error,
  uploadId: string,
  imageCharacteristics?: any
): { detectedObjects: DetectedObject[]; errorMessage: string; isAIGenerated: boolean } => {
  const processingError = error instanceof Error ? 
    createProcessingError('general_error', error.message, error) : 
    error;

  logger.error('❌ Processing failed, using enhanced fallback', 'Error Handler', {
    errorType: processingError.type,
    error: processingError.message,
    stack: processingError.originalError?.stack?.split('\n').slice(0, 3),
    hasImageCharacteristics: !!imageCharacteristics
  });
  
  // Enhanced fallback generation
  logger.info('🔄 Generating enhanced fallback data', 'Error Handler', {
    reason: processingError.message.substring(0, 100),
    imageComplexity: imageCharacteristics?.complexity || 'unknown'
  });
  
  let detectedObjects = generateMockDetectionResults(uploadId);
  
  // Enhance mock data based on image characteristics
  if (imageCharacteristics?.complexity === 'high') {
    const additionalElements = Math.floor(Math.random() * 5) + 3;
    const extraElements = generateMockDetectionResults(uploadId + '_extra').slice(0, additionalElements);
    detectedObjects = [...detectedObjects, ...extraElements];
  } else if (imageCharacteristics?.complexity === 'low') {
    detectedObjects = detectedObjects.slice(0, Math.max(5, Math.floor(detectedObjects.length * 0.6)));
  }
  
  // Ensure we have at least a minimum number of objects
  if (detectedObjects.length < 3) {
    detectedObjects = generateMockDetectionResults(uploadId);
  }
  
  logger.info('📝 Enhanced fallback data generated', 'Error Handler', {
    objectsCount: detectedObjects.length,
    reason: processingError.message.substring(0, 100),
    complexity: imageCharacteristics?.complexity || 'unknown',
    errorType: processingError.type
  });

  return {
    detectedObjects,
    errorMessage: processingError.message,
    isAIGenerated: false
  };
};
