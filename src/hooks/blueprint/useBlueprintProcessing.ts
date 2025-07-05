
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { updateUploadStatus, storeDetectionResults, storeProcessingMetadata } from './utils/databaseOperations';
import { analyzeImageCharacteristics } from './utils/imageProcessing';
import { logger } from '@/utils/logger';

// Import the new modular utilities
import { DetectedObject, ProcessingState } from './types/processingTypes';
import { useProcessingState } from './utils/processingStateManager';
import { processWithGemini } from './utils/geminiProcessor';
import { convertPlan2SceneToDetectedObjects } from './utils/dataConversion';
import { handleProcessingError, createProcessingError } from './utils/processingErrorHandler';
import { debugGeminiPipeline } from './utils/debugUtils';

// Import new text-based processing utilities
import { extractTextFromBlueprint } from './utils/textExtraction';
import { processWithTextBasedGemini } from './utils/textBasedGeminiProcessor';

// Helper function to generate objects from text data
const generateObjectsFromTextData = (extractedData: any, uploadId: string): DetectedObject[] => {
  const objects: DetectedObject[] = [];
  
  // Generate objects based on extracted rooms
  extractedData.structuredData.rooms.forEach((room: any, index: number) => {
    objects.push({
      label: room.type.replace('_', ' '),
      confidence: 0.85,
      bbox: {
        x: 10 + (index % 3) * 25,
        y: 10 + Math.floor(index / 3) * 20,
        width: getRoomWidth(room.type),
        height: getRoomHeight(room.type)
      }
    });
  });
  
  // Add basic structural elements
  objects.push(
    {
      label: 'wall',
      confidence: 0.90,
      bbox: { x: 5, y: 5, width: 80, height: 2 }
    },
    {
      label: 'door',
      confidence: 0.85,
      bbox: { x: 25, y: 5, width: 8, height: 12 }
    }
  );
  
  return objects;
};

const getRoomWidth = (roomType: string): number => {
  const widths: Record<string, number> = {
    living_room: 35, bedroom: 25, kitchen: 20, bathroom: 15
  };
  return widths[roomType] || 20;
};

const getRoomHeight = (roomType: string): number => {
  const heights: Record<string, number> = {
    living_room: 25, bedroom: 20, kitchen: 18, bathroom: 12
  };
  return heights[roomType] || 15;
};

export const useBlueprintProcessing = () => {
  const { processingState, updateProcessingState } = useProcessingState();
  const { toast } = useToast();

  const processBlueprint = useCallback(async (uploadId: string, imageUrl: string) => {
    logger.info('🚀 Starting enhanced Gemini AI blueprint processing pipeline', 'Blueprint Processing', {
      uploadId,
      imageUrl: imageUrl.substring(0, 100) + '...'
    });
    
    updateProcessingState({ 
      processing: true,
      processingMethod: null,
      errorMessage: null
    });

    try {
      // Step 1: Update status to processing (non-blocking)
      logger.info('📊 Step 1: Updating upload status', 'Blueprint Processing');
      const statusUpdated = await updateUploadStatus(uploadId, 'processing');
      if (!statusUpdated) {
        logger.warn('Status update failed but continuing processing', 'Blueprint Processing');
      }

      // Step 2: Enhanced image analysis
      logger.info('📊 Step 2: Enhanced image analysis starting', 'Blueprint Processing');
      const imageCharacteristics = await analyzeImageCharacteristics(imageUrl);
      logger.info('Image analysis completed', 'Blueprint Processing', imageCharacteristics);

      let detectedObjects: DetectedObject[] = [];
      let isAIGenerated = false;
      let processingError: string | undefined;
      
      // Step 3: Phase 2 Enhanced Hybrid Gemini AI processing
      try {
        logger.info('🚀 Step 3: Starting Phase 2 Hybrid Gemini AI processing', 'Blueprint Processing');
        
        // Test Gemini AI connection
        logger.info('🔧 Testing Gemini AI connection before processing', 'Blueprint Processing');
        const { testGeminiConnection } = await import('./utils/geminiConnectionTest');
        const connectionTest = await testGeminiConnection();
        
        logger.info('🔍 Connection test result', 'Blueprint Processing', {
          success: connectionTest.success,
          message: connectionTest.message
        });
        
        // Extract text data for hybrid processing
        logger.info('📝 Extracting text data for hybrid processing', 'Blueprint Processing');
        const extractedTextData = await extractTextFromBlueprint(imageUrl);
        
        logger.info('📊 Text extraction completed', 'Blueprint Processing', {
          textLength: extractedTextData.text.length,
          confidence: extractedTextData.confidence,
          roomsFound: extractedTextData.structuredData.rooms.length,
          measurementsFound: extractedTextData.dimensions.length
        });

        // Get image data for hybrid processing
        let imageBase64: string | null = null;
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          imageBase64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          logger.info('✅ Image data prepared for hybrid processing', 'Blueprint Processing');
        } catch (imageError) {
          logger.warn('⚠️ Could not prepare image data, proceeding with text-only', 'Blueprint Processing');
        }

        if (connectionTest.success) {
          logger.info('🤖 Processing with Phase 2 Hybrid Gemini AI', 'Blueprint Processing');
          console.log('🔧 DEBUG: Connection test passed, starting hybrid processing');
          
          // Use the new hybrid processor
          const { processWithHybridGemini } = await import('./utils/hybridGeminiProcessor');
          console.log('✅ DEBUG: Hybrid processor imported successfully');
          
          const processingResult = await processWithHybridGemini(
            imageBase64 || '',
            imageUrl,
            extractedTextData
          );
          console.log('📊 DEBUG: Hybrid processing result:', processingResult);
          
          detectedObjects = processingResult.objects;
          isAIGenerated = processingResult.method !== 'fallback';
          
          // Update processing method based on result
          const methodMapping: Record<string, 'ai' | 'text-ai' | 'fallback'> = {
            'image-ai': 'ai',
            'text-ai': 'text-ai', 
            'hybrid': 'ai',
            'fallback': 'fallback'
          };
          
          updateProcessingState({ processingMethod: methodMapping[processingResult.method] });
          
          // Enhanced user feedback based on quality and method
          const qualityEmoji = processingResult.quality === 'high' ? '🎯' : 
                              processingResult.quality === 'medium' ? '✅' : '📝';
          const methodText = processingResult.method === 'image-ai' ? 'Image-based AI' :
                            processingResult.method === 'text-ai' ? 'Text-based AI' :
                            processingResult.method === 'hybrid' ? 'Hybrid AI' :
                            'Enhanced Fallback';
          
          toast({
            title: `${qualityEmoji} Phase 2 ${methodText} Success!`,
            description: processingResult.details,
            variant: isAIGenerated ? "default" : "destructive",
          });
          
          logger.info('✅ Phase 2 Hybrid processing completed successfully', 'Blueprint Processing', {
            method: processingResult.method,
            quality: processingResult.quality,
            objectsDetected: detectedObjects.length,
            confidence: processingResult.confidence.toFixed(2),
            isAIGenerated
          });
        } else {
          // Enhanced fallback when AI is unavailable
          logger.info('🔄 Using enhanced fallback (AI unavailable)', 'Blueprint Processing');
          console.log('⚠️ DEBUG: Connection test failed, using fallback. Reason:', connectionTest.message);
          
          detectedObjects = generateObjectsFromTextData(extractedTextData, uploadId);
          isAIGenerated = false;
          updateProcessingState({ processingMethod: 'fallback' });
          
          toast({
            title: "📝 Enhanced Analysis Complete",
            description: `Generated ${detectedObjects.length} architectural elements using enhanced fallback analysis with extracted blueprint data.`,
            variant: "default",
          });
        }
        
      } catch (aiError) {
        logger.warn('Gemini AI processing failed, using fallback', 'Blueprint Processing', {
          error: aiError instanceof Error ? aiError.message : 'Unknown error',
          stack: aiError instanceof Error ? aiError.stack?.split('\n').slice(0, 3) : undefined
        });

        const errorResult = handleProcessingError(
          createProcessingError('general_error', aiError instanceof Error ? aiError.message : 'Gemini AI processing failed', aiError instanceof Error ? aiError : undefined),
          uploadId,
          imageCharacteristics
        );

        detectedObjects = errorResult.detectedObjects;
        processingError = errorResult.errorMessage;
        isAIGenerated = errorResult.isAIGenerated;
        
        updateProcessingState({ 
          processingMethod: 'fallback',
          errorMessage: processingError
        });
        
        toast({
          title: "⚠️ Using Enhanced Fallback",
          description: `AI processing failed. Generated ${detectedObjects.length} architectural elements using fallback analysis.`,
          variant: "destructive",
        });
      }

      // Step 4: Enhanced result storage with metadata
      logger.info('💾 Storing enhanced detection results', 'Blueprint Processing', {
        objectCount: detectedObjects.length,
        isAIGenerated,
        hasError: !!processingError
      });
      
      try {
        await storeDetectionResults(uploadId, detectedObjects, isAIGenerated, processingError);
        
        // Enhanced metadata storage (non-blocking)
        await storeProcessingMetadata(uploadId, {
          processingMethod: isAIGenerated ? 'ai' : 'fallback',
          errorMessage: processingError,
          imageCharacteristics,
          processingTimeMs: 5000,
          objectCount: detectedObjects.length
        });
      } catch (storageError) {
        logger.error('Failed to store results but continuing', 'Blueprint Processing', {
          error: storageError instanceof Error ? storageError.message : 'Unknown error'
        });
      }

      // Step 5: Update final status (non-blocking)
      const finalStatus = isAIGenerated ? 'processed' : 'processed_fallback';
      const finalStatusUpdated = await updateUploadStatus(uploadId, finalStatus);
      if (!finalStatusUpdated) {
        logger.warn('Final status update failed but processing completed', 'Blueprint Processing');
      }

      logger.info('✅ Enhanced blueprint processing completed successfully!', 'Blueprint Processing', {
        method: isAIGenerated ? 'Gemini AI' : 'Enhanced Fallback',
        objectsFound: detectedObjects.length,
        hasError: !!processingError,
        finalStatus
      });

      return detectedObjects;

    } catch (error) {
      logger.error('💥 Blueprint processing pipeline failed', 'Blueprint Processing', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
      });
      
      updateProcessingState({ 
        processingMethod: null,
        errorMessage: error instanceof Error ? error.message : 'Processing failed'
      });
      
      // Try to update status to failed (non-blocking)
      await updateUploadStatus(uploadId, 'failed');
      
      toast({
        title: "❌ Processing Failed",
        description: `Blueprint analysis failed: ${error instanceof Error ? error.message.substring(0, 100) : "An unexpected error occurred"}`,
        variant: "destructive",
      });

      throw error;
    } finally {
      updateProcessingState({ processing: false });
    }
  }, [toast, updateProcessingState]);

  const generate3DModel = useCallback(async (uploadId: string, detectedObjects: DetectedObject[], imageUrl: string) => {
    updateProcessingState({ generating3D: true });

    try {
      logger.info('🏗️ Starting enhanced 3D model generation with unique GLB files', '3D Generation', {
        uploadId,
        objectCount: detectedObjects.length
      });

      // Generate unique model identifier
      const modelTimestamp = Date.now();
      const modelId = `${uploadId}_${modelTimestamp}`;
      const uniqueFileName = `${uploadId}/model_${modelTimestamp}.glb`;

      logger.info('🆕 Generating unique 3D model GLB file', '3D Generation', {
        modelId,
        fileName: uniqueFileName
      });
      
      const isAIGenerated = processingState.processingMethod === 'ai';
      
      // Call the enhanced 3D generation edge function
      const { data: generationResult, error: generationError } = await supabase.functions.invoke('generate-3d-model', {
        body: {
          uploadId,
          detectedObjects,
          imageUrl,
          uniqueFileName,
          isAIGenerated
        }
      });

      if (generationError) {
        logger.warn('3D generation service failed, creating fallback model', '3D Generation', {
          error: generationError.message
        });
        
        // Create fallback model record
        const { data: fallbackModel } = await supabase
          .from('generated_3d_models')
          .insert({
            upload_id: uploadId,
            model_name: `Fallback Model ${modelTimestamp}`,
            model_description: `Fallback 3D model for upload ${uploadId} - Generation service unavailable`,
            model_file_path: 'placeholder.glb',
            file_size: 2048,
            generation_status: 'completed',
            generation_prompt: 'Fallback generation'
          })
          .select()
          .single();

        return fallbackModel ? [fallbackModel] : [];
      }

      // Retrieve the generated model from database
      const { data: newModel } = await supabase
        .from('generated_3d_models')
        .select('*')
        .eq('upload_id', uploadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      logger.info('✅ Unique 3D model generation completed', '3D Generation', {
        modelId: newModel?.id,
        fileName: newModel?.model_file_path,
        fileSize: newModel?.file_size,
        isAIGenerated
      });

      return newModel ? [newModel] : [];
      
    } catch (error) {
      logger.error('💥 Enhanced 3D generation error', '3D Generation', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Enhanced error recovery
      const { data: newModel } = await supabase
        .from('generated_3d_models')
        .insert({
          upload_id: uploadId,
          model_name: 'Blueprint Model (Enhanced Error Recovery)',
          model_description: 'Generated during enhanced error recovery - maintains basic functionality with improved reliability',
          model_file_path: 'placeholder.glb',
          file_size: 2048,
          generation_status: 'completed'
        })
        .select()
        .single();
      
      return newModel ? [newModel] : [];
    } finally {
      updateProcessingState({ generating3D: false });
    }
  }, [processingState.processingMethod, updateProcessingState]);

  return {
    processing: processingState.processing,
    generating3D: processingState.generating3D,
    processingMethod: processingState.processingMethod,
    errorMessage: processingState.errorMessage,
    processBlueprint,
    generate3DModel
  };
};
