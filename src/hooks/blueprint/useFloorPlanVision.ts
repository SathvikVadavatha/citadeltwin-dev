import { useState, useCallback, useRef } from 'react';
import { pipeline, Pipeline } from '@huggingface/transformers';
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';
import { FloorPlanVisionResult, VisionDetectedObject, ModelLoadingState, FloorPlanVisionConfig } from './types/visionTypes';
import { DetectedObject } from './types/processingTypes';

const DEFAULT_CONFIG: FloorPlanVisionConfig = {
  modelId: 'sabaridsnfuji/FloorPlanVisionAIAdaptor',
  preferredDevice: 'auto',
  maxImageSize: 1024,
  confidenceThreshold: 0.5
};

export const useFloorPlanVision = (config: Partial<FloorPlanVisionConfig> = {}) => {
  const { toast } = useToast();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [modelState, setModelState] = useState<ModelLoadingState>({
    isLoading: false,
    progress: 0,
    status: 'initializing'
  });
  
  const pipelineRef = useRef<Pipeline | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const checkWebGPUSupport = useCallback(async (): Promise<'webgpu' | 'cpu'> => {
    try {
      if ('gpu' in navigator) {
        const gpu = (navigator as any).gpu;
        const adapter = await gpu?.requestAdapter();
        if (adapter) {
          return 'webgpu';
        }
      }
    } catch (error) {
      logger.warn('WebGPU not available', 'FloorPlan Vision');
    }
    
    return 'cpu';
  }, []);

  const initializeModel = useCallback(async () => {
    if (pipelineRef.current) {
      return pipelineRef.current;
    }

    setModelState(prev => ({ ...prev, isLoading: true, status: 'initializing' }));
    
    try {
      logger.info('🤖 Initializing FloorPlanVisionAIAdaptor model', 'FloorPlan Vision');
      
      let deviceType: 'webgpu' | 'cpu' = 'cpu';
      if (finalConfig.preferredDevice === 'auto') {
        deviceType = await checkWebGPUSupport();
      } else if (finalConfig.preferredDevice === 'webgpu') {
        deviceType = 'webgpu';
      }

      setModelState(prev => ({ ...prev, status: 'downloading', deviceType }));
      
      toast({
        title: "🧠 Loading AI Vision Model",
        description: `Initializing floor plan analysis with ${deviceType.toUpperCase()} acceleration...`,
      });

      // Create the vision pipeline
      const visionPipeline = await pipeline(
        'object-detection',
        finalConfig.modelId,
        { 
          device: deviceType,
          progress_callback: (progress: any) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setModelState(prev => ({ 
              ...prev, 
              progress: percentage,
              status: percentage < 100 ? 'downloading' : 'loading'
            }));
          }
        }
      );

      pipelineRef.current = visionPipeline as any;
      
      setModelState({
        isLoading: false,
        progress: 100,
        status: 'ready',
        deviceType
      });

      logger.info('✅ FloorPlanVisionAIAdaptor model ready', 'FloorPlan Vision', { deviceType });
      
      toast({
        title: "✅ AI Vision Model Ready",
        description: `Floor plan analysis ready with ${deviceType.toUpperCase()} acceleration`,
      });

      return visionPipeline;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load model';
      logger.error('❌ Model initialization failed', 'FloorPlan Vision', { error: errorMessage });
      
      setModelState({
        isLoading: false,
        progress: 0,
        status: 'error',
        error: errorMessage
      });

      toast({
        title: "❌ Model Loading Failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  }, [finalConfig, checkWebGPUSupport, toast]);

  const convertVisionToDetectedObjects = useCallback((visionResults: any[]): DetectedObject[] => {
    return visionResults
      .filter(result => result.score >= finalConfig.confidenceThreshold)
      .map(result => ({
        label: result.label || 'architectural_element',
        confidence: result.score,
        bbox: {
          x: result.bbox?.x || 0,
          y: result.bbox?.y || 0,
          width: result.bbox?.width || 20,
          height: result.bbox?.height || 20
        }
      }));
  }, [finalConfig.confidenceThreshold]);

  const analyzeFloorPlan = useCallback(async (imageUrl: string): Promise<DetectedObject[]> => {
    setIsProcessing(true);
    const startTime = Date.now();

    try {
      logger.info('🔍 Starting AI floor plan analysis', 'FloorPlan Vision', { imageUrl: imageUrl.substring(0, 100) + '...' });

      // Initialize model if not ready
      const model = await initializeModel();
      
      toast({
        title: "🔍 Analyzing Floor Plan",
        description: "AI vision model processing architectural elements...",
      });

      // Run inference on the image
      const results = await model(imageUrl);
      
      const processingTime = Date.now() - startTime;
      const detectedObjects = convertVisionToDetectedObjects(results);

      logger.info('✅ AI floor plan analysis complete', 'FloorPlan Vision', {
        objectsDetected: detectedObjects.length,
        processingTime,
        deviceType: modelState.deviceType
      });

      toast({
        title: "✅ AI Analysis Complete",
        description: `Detected ${detectedObjects.length} architectural elements in ${(processingTime/1000).toFixed(1)}s`,
      });

      return detectedObjects;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Vision analysis failed';
      logger.error('❌ AI floor plan analysis failed', 'FloorPlan Vision', { error: errorMessage });
      
      toast({
        title: "❌ AI Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [initializeModel, convertVisionToDetectedObjects, modelState.deviceType, toast]);

  const isModelReady = modelState.status === 'ready' && pipelineRef.current !== null;
  const supportsWebGPU = modelState.deviceType === 'webgpu';

  return {
    // Model state
    modelState,
    isModelReady,
    isProcessing,
    supportsWebGPU,
    
    // Actions
    initializeModel,
    analyzeFloorPlan,
    
    // Config
    config: finalConfig
  };
};