
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface DetectedObject {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ProcessingState {
  processing: boolean;
  generating3D: boolean;
}

export const useBlueprintProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    processing: false,
    generating3D: false
  });

  const generateMockDetections = useCallback((): DetectedObject[] => {
    return [
      { label: 'door', confidence: 0.92, bbox: { x: 25, y: 45, width: 8, height: 15 } },
      { label: 'window', confidence: 0.88, bbox: { x: 60, y: 30, width: 12, height: 10 } },
      { label: 'wall', confidence: 0.95, bbox: { x: 10, y: 20, width: 80, height: 5 } },
      { label: 'room', confidence: 0.87, bbox: { x: 15, y: 25, width: 70, height: 50 } },
      { label: 'kitchen', confidence: 0.85, bbox: { x: 55, y: 20, width: 30, height: 20 } },
      { label: 'bedroom', confidence: 0.83, bbox: { x: 10, y: 55, width: 35, height: 25 } },
      { label: 'bathroom', confidence: 0.89, bbox: { x: 50, y: 55, width: 20, height: 15 } }
    ];
  }, []);

  const processBlueprint = useCallback(async (uploadId: string) => {
    setProcessingState(prev => ({ ...prev, processing: true }));

    try {
      const mockDetectedObjects = generateMockDetections();

      await supabase
        .from('detection_results')
        .insert({
          upload_id: uploadId,
          detected_objects: mockDetectedObjects as any,
          processing_time_ms: 3500,
          model_used: 'plan2scene-analyzer',
          confidence_threshold: 0.5
        });

      return mockDetectedObjects;
    } finally {
      setProcessingState(prev => ({ ...prev, processing: false }));
    }
  }, [generateMockDetections]);

  const generate3DModel = useCallback(async (uploadId: string, detectedObjects: DetectedObject[], imageUrl: string) => {
    setProcessingState(prev => ({ ...prev, generating3D: true }));

    try {
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke('generate-3d-model', {
          body: {
            uploadId,
            detectedObjects,
            imageUrl
          }
        });

      if (functionError) throw functionError;

      const { data: modelsData, error: modelsError } = await supabase
        .from('generated_3d_models')
        .select('*')
        .eq('upload_id', uploadId);

      if (modelsError) throw modelsError;

      return modelsData;
    } finally {
      setProcessingState(prev => ({ ...prev, generating3D: false }));
    }
  }, []);

  return {
    ...processingState,
    processBlueprint,
    generate3DModel
  };
};
