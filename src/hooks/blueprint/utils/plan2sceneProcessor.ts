
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

interface Plan2SceneRoom {
  type: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  elements: Array<{
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>;
}

export const processWithPlan2Scene = async (imageBase64: string, uploadId: string): Promise<DetectedObject[]> => {
  try {
    console.log('🏗️ Starting Plan2Scene open-source processing...');
    
    // Validate base64 image data
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid or empty image data');
    }

    // Clean base64 data - remove data URL prefix if present
    let cleanImageData = imageBase64;
    if (imageBase64.startsWith('data:image/')) {
      cleanImageData = imageBase64.split(',')[1];
    }

    console.log('📤 Calling Plan2Scene processing edge function...');

    const { data: plan2sceneResult, error: plan2sceneError } = await supabase.functions.invoke('plan2scene-processor', {
      body: {
        imageData: cleanImageData,
        uploadId: uploadId
      }
    });

    console.log('📥 Plan2Scene response received:', { 
      hasData: !!plan2sceneResult, 
      hasError: !!plan2sceneError 
    });

    if (plan2sceneError) {
      console.error('❌ Plan2Scene error:', plan2sceneError);
      throw new Error(`Plan2Scene processing failed: ${plan2sceneError.message || 'Unknown error'}`);
    }

    if (!plan2sceneResult || !plan2sceneResult.success) {
      console.error('❌ No successful result from Plan2Scene:', plan2sceneResult);
      throw new Error('Plan2Scene returned no successful results');
    }

    console.log('✅ Plan2Scene processing successful, converting to detection objects...');
    
    // Convert Plan2Scene rooms to our DetectedObject format
    const detectedObjects: DetectedObject[] = [];
    
    if (plan2sceneResult.rooms && Array.isArray(plan2sceneResult.rooms)) {
      plan2sceneResult.rooms.forEach((room: Plan2SceneRoom, index: number) => {
        // Add room as detected object
        detectedObjects.push({
          label: mapRoomTypeToLabel(room.type),
          confidence: room.confidence,
          bbox: {
            x: room.bounds.x,
            y: room.bounds.y,
            width: room.bounds.width,
            height: room.bounds.height
          }
        });

        // Add room elements (doors, windows, fixtures)
        if (room.elements && Array.isArray(room.elements)) {
          room.elements.forEach((element) => {
            detectedObjects.push({
              label: mapElementTypeToLabel(element.type),
              confidence: room.confidence * 0.9, // Slightly lower confidence for elements
              bbox: {
                x: element.position.x,
                y: element.position.y,
                width: element.size.width,
                height: element.size.height
              }
            });
          });
        }
      });
    }

    // Add structural elements if detected
    if (plan2sceneResult.walls && Array.isArray(plan2sceneResult.walls)) {
      plan2sceneResult.walls.forEach((wall: any) => {
        detectedObjects.push({
          label: "wall",
          confidence: wall.confidence || 0.85,
          bbox: {
            x: wall.start.x,
            y: wall.start.y,
            width: Math.abs(wall.end.x - wall.start.x) || 5,
            height: Math.abs(wall.end.y - wall.start.y) || 5
          }
        });
      });
    }

    console.log(`✅ Generated ${detectedObjects.length} detected objects from Plan2Scene results`);
    return detectedObjects;

  } catch (error) {
    console.error('💥 Plan2Scene processing error:', error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Plan2Scene processing timed out - try a simpler image or try again');
      } else if (error.message.includes('format')) {
        throw new Error('Image format not supported by Plan2Scene - try a different image format (PNG, JPEG)');
      } else if (error.message.includes('size')) {
        throw new Error('Image too large - please use an image smaller than 10MB');
      }
    }
    
    throw new Error(`Plan2Scene analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper functions to map Plan2Scene types to our system
function mapRoomTypeToLabel(roomType: string): string {
  const mapping: Record<string, string> = {
    'living_room': 'room',
    'bedroom': 'bedroom',
    'kitchen': 'kitchen',
    'bathroom': 'bathroom',
    'dining_room': 'room',
    'office': 'room',
    'closet': 'closet',
    'hallway': 'room',
    'balcony': 'room',
    'laundry': 'room'
  };
  
  return mapping[roomType.toLowerCase()] || 'room';
}

function mapElementTypeToLabel(elementType: string): string {
  const mapping: Record<string, string> = {
    'door': 'door',
    'window': 'window',
    'sink': 'fixture',
    'toilet': 'fixture',
    'bathtub': 'fixture',
    'shower': 'fixture',
    'stove': 'fixture',
    'refrigerator': 'fixture',
    'bed': 'fixture',
    'sofa': 'fixture',
    'table': 'fixture',
    'cabinet': 'fixture'
  };
  
  return mapping[elementType.toLowerCase()] || 'fixture';
}
