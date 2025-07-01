
export interface DetectedObject {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ProcessingState {
  processing: boolean;
  generating3D: boolean;
  processingMethod: 'ai' | 'fallback' | null;
  errorMessage: string | null;
}

export interface Plan2SceneResult {
  success: boolean;
  rooms?: Array<{
    type: string;
    confidence?: number;
    bounds?: { x: number; y: number; width: number; height: number };
    bbox?: { x: number; y: number; width: number; height: number };
    area?: number;
  }>;
  walls?: Array<{
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    confidence?: number;
  }>;
  elements?: Array<{
    type: string;
    confidence?: number;
    position?: { x: number; y: number };
    x?: number;
    y?: number;
    size?: { width: number; height: number };
    width?: number;
    height?: number;
  }>;
  error?: string;
  errorType?: string;
  errorDetails?: any;
  processingStats?: any;
  qualityMetrics?: any;
}
