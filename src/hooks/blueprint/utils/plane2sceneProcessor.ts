
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

export const processWithPlane2Scene = async (imageBase64: string, uploadId: string): Promise<DetectedObject[]> => {
  try {
    console.log('🏗️ Starting Plane2Scene 3D generation...');
    
    // Validate base64 image data
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid or empty image data');
    }

    // Clean base64 data - remove data URL prefix if present
    let cleanImageData = imageBase64;
    if (imageBase64.startsWith('data:image/')) {
      cleanImageData = imageBase64.split(',')[1];
    }

    console.log('📤 Calling Plane2Scene edge function...');

    const { data: plane2sceneResult, error: plane2sceneError } = await supabase.functions.invoke('plane2scene-3d', {
      body: {
        imageData: cleanImageData,
        uploadId: uploadId
      }
    });

    console.log('📥 Plane2Scene response received:', { 
      hasData: !!plane2sceneResult, 
      hasError: !!plane2sceneError 
    });

    if (plane2sceneError) {
      console.error('❌ Plane2Scene error:', plane2sceneError);
      throw new Error(`Plane2Scene processing failed: ${plane2sceneError.message || 'Unknown error'}`);
    }

    if (!plane2sceneResult || !plane2sceneResult.success) {
      console.error('❌ No successful result from Plane2Scene:', plane2sceneResult);
      throw new Error('Plane2Scene returned no successful results');
    }

    console.log('✅ Plane2Scene processing successful, generating detection objects...');
    
    // Generate mock detection objects for compatibility with existing system
    // In a real implementation, Plane2Scene would provide actual detected objects
    const mockDetectedObjects: DetectedObject[] = [
      { label: "building_structure", confidence: 0.95, bbox: { x: 10, y: 10, width: 80, height: 60 } },
      { label: "wall", confidence: 0.92, bbox: { x: 15, y: 15, width: 70, height: 5 } },
      { label: "wall", confidence: 0.91, bbox: { x: 15, y: 65, width: 70, height: 5 } },
      { label: "wall", confidence: 0.90, bbox: { x: 15, y: 15, width: 5, height: 50 } },
      { label: "wall", confidence: 0.89, bbox: { x: 80, y: 15, width: 5, height: 50 } },
      { label: "door", confidence: 0.88, bbox: { x: 45, y: 65, width: 8, height: 5 } },
      { label: "window", confidence: 0.85, bbox: { x: 25, y: 15, width: 12, height: 5 } },
      { label: "window", confidence: 0.84, bbox: { x: 60, y: 15, width: 12, height: 5 } },
      { label: "room", confidence: 0.87, bbox: { x: 20, y: 20, width: 30, height: 40 } },
      { label: "room", confidence: 0.86, bbox: { x: 55, y: 20, width: 25, height: 40 } }
    ];

    return mockDetectedObjects;

  } catch (error) {
    console.error('💥 Plane2Scene processing error:', error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('400')) {
        throw new Error('Image format not supported by Plane2Scene - try a different image format (PNG, JPEG)');
      } else if (error.message.includes('413')) {
        throw new Error('Image too large - please use an image smaller than 10MB');
      } else if (error.message.includes('timeout')) {
        throw new Error('Plane2Scene processing timed out - try a simpler image or try again');
      }
    }
    
    throw new Error(`Plane2Scene analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
