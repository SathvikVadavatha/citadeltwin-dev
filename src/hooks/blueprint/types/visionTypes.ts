export interface FloorPlanVisionResult {
  detectedObjects: VisionDetectedObject[];
  confidence: number;
  processingTime: number;
  modelUsed: string;
  deviceType: 'webgpu' | 'webgl' | 'cpu';
}

export interface VisionDetectedObject {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  category: 'structural' | 'architectural' | 'room' | 'fixture';
}

export interface ModelLoadingState {
  isLoading: boolean;
  progress: number;
  status: 'initializing' | 'downloading' | 'loading' | 'ready' | 'error';
  error?: string;
  deviceType?: 'webgpu' | 'webgl' | 'cpu';
}

export interface FloorPlanVisionConfig {
  modelId: string;
  preferredDevice: 'webgpu' | 'webgl' | 'cpu' | 'auto';
  maxImageSize: number;
  confidenceThreshold: number;
}