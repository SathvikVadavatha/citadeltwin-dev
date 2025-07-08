import { useState, useCallback, useRef } from 'react';
import { pipeline, Pipeline } from '@huggingface/transformers';
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';
import { FloorPlanVisionResult, VisionDetectedObject, ModelLoadingState, FloorPlanVisionConfig } from './types/visionTypes';
import { DetectedObject } from './types/processingTypes';

const DEFAULT_CONFIG: FloorPlanVisionConfig = {
  modelId: 'Xenova/detr-resnet-50',
  preferredDevice: 'auto',
  maxImageSize: 1024,
  confidenceThreshold: 0.25
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
      logger.info('🤖 Initializing AI vision model', 'FloorPlan Vision', { modelId: finalConfig.modelId });
      
      let deviceType: 'webgpu' | 'cpu' = 'cpu';
      if (finalConfig.preferredDevice === 'auto') {
        deviceType = await checkWebGPUSupport();
      } else if (finalConfig.preferredDevice === 'webgpu') {
        deviceType = 'webgpu';
      }

      setModelState(prev => ({ ...prev, status: 'downloading', deviceType }));
      
      toast({
        title: "🧠 Loading AI Vision Model",
        description: `Initializing computer vision model with ${deviceType.toUpperCase()} acceleration...`,
      });

      logger.info('📥 Downloading model from HuggingFace', 'FloorPlan Vision', { 
        modelId: finalConfig.modelId,
        device: deviceType 
      });

      // Create the vision pipeline with error handling
      const visionPipeline = await pipeline(
        'object-detection',
        finalConfig.modelId,
        { 
          device: deviceType,
          progress_callback: (progress: any) => {
            if (progress.loaded && progress.total) {
              const percentage = Math.round((progress.loaded / progress.total) * 100);
              setModelState(prev => ({ 
                ...prev, 
                progress: percentage,
                status: percentage < 100 ? 'downloading' : 'loading'
              }));
              logger.info(`📊 Model download progress: ${percentage}%`, 'FloorPlan Vision');
            }
          }
        }
      );

      if (!visionPipeline) {
        throw new Error('Failed to create vision pipeline - model returned null');
      }

      pipelineRef.current = visionPipeline as any;
      
      setModelState({
        isLoading: false,
        progress: 100,
        status: 'ready',
        deviceType
      });

      logger.info('✅ AI vision model ready for floor plan analysis', 'FloorPlan Vision', { 
        deviceType,
        modelId: finalConfig.modelId 
      });
      
      toast({
        title: "✅ AI Vision Model Ready",
        description: `Computer vision model ready with ${deviceType.toUpperCase()} acceleration`,
      });

      return visionPipeline;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load model';
      const detailedError = {
        message: errorMessage,
        modelId: finalConfig.modelId,
        stack: error instanceof Error ? error.stack : undefined
      };
      
      logger.error('❌ AI vision model initialization failed', 'FloorPlan Vision', detailedError);
      
      setModelState({
        isLoading: false,
        progress: 0,
        status: 'error',
        error: errorMessage
      });

      // Specific error messages for common issues
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        userFriendlyMessage = `Model "${finalConfig.modelId}" not found. Using fallback analysis.`;
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = 'Network error loading AI model. Using fallback analysis.';
      } else if (errorMessage.includes('WebGL') || errorMessage.includes('WebGPU')) {
        userFriendlyMessage = 'GPU acceleration unavailable. Using fallback analysis.';
      }

      toast({
        title: "⚠️ AI Model Unavailable",
        description: userFriendlyMessage,
        variant: "destructive",
      });

      throw error;
    }
  }, [finalConfig, checkWebGPUSupport, toast]);

  const convertVisionToDetectedObjects = useCallback((visionResults: any[]): DetectedObject[] => {
    if (!Array.isArray(visionResults)) {
      logger.warn('Vision results is not an array', 'FloorPlan Vision', { results: visionResults });
      return [];
    }

    logger.info('🔍 Processing vision results', 'FloorPlan Vision', { 
      totalResults: visionResults.length,
      sampleResult: visionResults[0] 
    });

    const filteredResults = visionResults
      .filter(result => result && result.score >= finalConfig.confidenceThreshold)
      .map((result, index) => {
        // Map common object detection labels to architectural terms
        const label = mapToArchitecturalLabel(result.label || 'architectural_element');
        
        return {
          label,
          confidence: result.score,
          bbox: {
            x: Math.round(result.box?.xmin || result.bbox?.x || index * 15),
            y: Math.round(result.box?.ymin || result.bbox?.y || index * 15),
            width: Math.round((result.box?.xmax - result.box?.xmin) || result.bbox?.width || 20),
            height: Math.round((result.box?.ymax - result.box?.ymin) || result.bbox?.height || 20)
          }
        };
      });

    logger.info('✅ Converted vision results to architectural objects', 'FloorPlan Vision', {
      originalCount: visionResults.length,
      filteredCount: filteredResults.length,
      confidenceThreshold: finalConfig.confidenceThreshold
    });

    return filteredResults;
  }, [finalConfig.confidenceThreshold]);

  // Helper function to map detected objects to architectural terms
  const mapToArchitecturalLabel = (label: string): string => {
    const mappings: Record<string, string> = {
      'person': 'room_occupant',
      'chair': 'furniture',
      'couch': 'living_room_furniture', 
      'bed': 'bedroom_furniture',
      'dining table': 'dining_furniture',
      'toilet': 'bathroom_fixture',
      'tv': 'entertainment_center',
      'laptop': 'workspace',
      'mouse': 'workspace',
      'keyboard': 'workspace',
      'cell phone': 'technology',
      'microwave': 'kitchen_appliance',
      'oven': 'kitchen_appliance',
      'toaster': 'kitchen_appliance',
      'sink': 'plumbing_fixture',
      'refrigerator': 'kitchen_appliance',
      'book': 'storage_item',
      'clock': 'wall_fixture',
      'vase': 'decorative_item',
      'scissors': 'utility_item',
      'teddy bear': 'personal_item',
      'hair drier': 'bathroom_appliance',
      'toothbrush': 'bathroom_accessory'
    };
    
    return mappings[label.toLowerCase()] || label.replace(/[\s-]+/g, '_').toLowerCase();
  };

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