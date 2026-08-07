import { useState, useCallback } from 'react';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Gemini sometimes wraps JSON in ```json ... ``` or ``` ... ``` fences, or leaves stray
// leading/trailing whitespace. Strip that before any JSON.parse attempt so more
// responses parse successfully instead of failing on the fence markers themselves.
const stripCodeFences = (text: string): string =>
  text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

interface BlueprintAnalysis {
  elements: Array<{
    type: 'wall' | 'door' | 'window' | 'room' | 'fixture';
    name: string;
    dimensions: {
      width: number;
      height: number;
      depth?: number;
    };
    position: {
      x: number;
      y: number;
      z?: number;
    };
    properties: Record<string, any>;
  }>;
  rooms: Array<{
    name: string;
    type: string;
    area: number;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  scale: number;
  totalArea: number;
  buildingType: string;
  floorPlanData?: {
    dimensions: {
      width: number;
      height: number;
    };
    rooms: Array<{
      name: string;
      type: string;
      area: number;
      bounds: { x: number; y: number; width: number; height: number };
    }>;
    elements: Array<{
      type: string;
      name: string;
      position: { x: number; y: number };
      dimensions: { width: number; height: number };
    }>;
  };
}

interface Generated3DModel {
  geometry: {
    vertices: number[];
    faces: number[];
    normals: number[];
    uvs: number[];
  };
  materials: Array<{
    name: string;
    type: string;
    properties: Record<string, any>;
  }>;
  scene: {
    objects: Array<{
      name: string;
      type: string;
      geometry: string;
      material: string;
      transform: {
        position: [number, number, number];
        rotation: [number, number, number];
        scale: [number, number, number];
      };
    }>;
    lights: Array<{
      type: string;
      position: [number, number, number];
      intensity: number;
      color: string;
    }>;
  };
}

export const useGeminiBlueprint3D = () => {
  const { analyzeBlueprintImage, generate3DFromBlueprint } = useGeminiAI();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [generating3D, setGenerating3D] = useState(false);
  const [blueprintAnalysis, setBlueprintAnalysis] = useState<BlueprintAnalysis | null>(null);
  const [generated3DModel, setGenerated3DModel] = useState<Generated3DModel | null>(null);

  const convertImageUrlToBase64 = useCallback(async (imageUrl: string): Promise<string> => {
    try {
      console.log('Converting image URL to base64:', imageUrl);
      
      // Add better cache busting and headers for Supabase storage
      const timestampedUrl = imageUrl.includes('?') 
        ? `${imageUrl}&t=${Date.now()}` 
        : `${imageUrl}?t=${Date.now()}`;
      
      const response = await fetch(timestampedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/jpeg, image/png, image/gif, image/webp, */*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error('Fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Image blob details:', { size: blob.size, type: blob.type });
      
      if (blob.size === 0) {
        throw new Error('Image file is empty');
      }
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (!result || result.length < 100) {
            reject(new Error('Base64 conversion resulted in invalid data'));
            return;
          }
          console.log('Base64 conversion successful, length:', result.length);
          resolve(result);
        };
        reader.onerror = () => {
          console.error('FileReader error:', reader.error);
          reject(new Error('Failed to convert image to base64'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error(`Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const analyzeBlueprint = useCallback(async (imageUrl: string, uploadId: string) => {
    setAnalyzing(true);
    try {
      console.log('Starting detailed blueprint analysis for:', imageUrl, uploadId);
      
      // Convert image with better error handling
      let base64Image: string;
      try {
        base64Image = await convertImageUrlToBase64(imageUrl);
        console.log('Image converted successfully, sending to Gemini AI...');
      } catch (conversionError) {
        console.error('Image conversion failed:', conversionError);
        throw new Error(`Failed to process image: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
      }

      // Enhanced Gemini prompt for better analysis
      const enhancedPrompt = `Analyze this architectural blueprint/floor plan image in detail. I need you to carefully examine and identify:

1. All rooms and their approximate dimensions
2. Doors, windows, and their locations  
3. Walls and structural elements
4. Any fixtures, appliances, or special features
5. Calculate realistic room areas based on visible dimensions
6. Determine the building type (residential, commercial, etc.)

Return your analysis as a detailed JSON object with this exact structure:
{
  "elements": [
    {
      "type": "wall|door|window|room|fixture",
      "name": "descriptive name",
      "dimensions": {"width": number, "height": number, "depth": number},
      "position": {"x": number, "y": number, "z": number},
      "properties": {"material": "string", "color": "string", "function": "string"}
    }
  ],
  "rooms": [
    {
      "name": "room name from blueprint",
      "type": "bedroom|kitchen|bathroom|living|dining|office|closet|balcony|laundry",
      "area": calculated_area_in_sqft,
      "bounds": {"x": number, "y": number, "width": number, "height": number}
    }
  ],
  "scale": estimated_scale_factor,
  "totalArea": sum_of_all_room_areas,
  "buildingType": "residential|commercial|industrial|mixed"
}

BE SPECIFIC AND UNIQUE - analyze what you actually see in THIS image, not generic data. Look for text labels, dimension markings, and architectural symbols.`;

      // Call Gemini with retry logic
      let analysisResponse;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          console.log(`Gemini analysis attempt ${attempts + 1}/${maxAttempts}`);
          analysisResponse = await analyzeBlueprintImage(base64Image, enhancedPrompt);
          
          if (analysisResponse?.result && analysisResponse.result.length > 100) {
            console.log('Gemini response received:', analysisResponse.result.substring(0, 300) + '...');
            break;
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            console.warn(`Analysis attempt ${attempts} returned insufficient data, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (apiError) {
          attempts++;
          console.error(`API call attempt ${attempts} failed:`, apiError);
          if (attempts >= maxAttempts) {
            throw new Error(`Gemini AI failed after ${maxAttempts} attempts: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!analysisResponse?.result || analysisResponse.result.length < 100) {
        throw new Error('Gemini AI failed to provide detailed analysis after multiple attempts');
      }

      // Parse JSON response with better extraction
      let parsedAnalysis: BlueprintAnalysis;
      try {
        const cleanedResult = stripCodeFences(analysisResponse.result);

        const jsonPatterns = [
          /```json\s*([\s\S]*?)\s*```/i,
          /```\s*([\s\S]*?)\s*```/i,
          /\{[\s\S]*\}/,
          /"elements":\s*\[[\s\S]*?"buildingType":\s*"[^"]*"/
        ];

        let jsonText = '';
        for (const pattern of jsonPatterns) {
          const match = cleanedResult.match(pattern);
          if (match) {
            jsonText = match[1] || match[0];
            console.log('Extracted JSON pattern:', jsonText.substring(0, 200) + '...');
            break;
          }
        }

        if (jsonText) {
          jsonText = stripCodeFences(jsonText).replace(/[\r\n]+/g, ' ').trim();

          console.log('Parsing cleaned JSON:', jsonText.substring(0, 200) + '...');
          parsedAnalysis = JSON.parse(jsonText);
          
          if (!parsedAnalysis.elements || !Array.isArray(parsedAnalysis.elements)) {
            throw new Error('Invalid analysis structure: missing elements array');
          }
          if (!parsedAnalysis.rooms || !Array.isArray(parsedAnalysis.rooms)) {
            throw new Error('Invalid analysis structure: missing rooms array');
          }
          
          console.log('Successfully parsed Gemini analysis:', {
            elements: parsedAnalysis.elements.length,
            rooms: parsedAnalysis.rooms.length,
            totalArea: parsedAnalysis.totalArea,
            buildingType: parsedAnalysis.buildingType
          });
          
        } else {
          throw new Error('No valid JSON structure found in Gemini response');
        }
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.log('Raw Gemini response:', analysisResponse.result);
        throw new Error(`Failed to parse Gemini AI response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
      }

      // Add unique identifiers to ensure uniqueness
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2);
      
      parsedAnalysis.elements = parsedAnalysis.elements.map((element, index) => ({
        ...element,
        properties: {
          ...element.properties,
          analysisId: `${uploadId}-${timestamp}-${uniqueId}-${index}`,
          timestamp,
          uniqueId
        }
      }));

      // Ensure floorPlanData matches the analysis
      parsedAnalysis.floorPlanData = {
        dimensions: {
          width: Math.max(...parsedAnalysis.rooms.map(r => r.bounds.x + r.bounds.width), 40),
          height: Math.max(...parsedAnalysis.rooms.map(r => r.bounds.y + r.bounds.height), 30)
        },
        rooms: parsedAnalysis.rooms,
        elements: parsedAnalysis.elements.map(el => ({
          type: el.type,
          name: el.name,
          position: { x: el.position.x, y: el.position.y },
          dimensions: { width: el.dimensions.width, height: el.dimensions.height }
        }))
      };

      setBlueprintAnalysis(parsedAnalysis);

      // Update database with successful analysis
      await supabase
        .from('blueprint_uploads')
        .update({
          upload_status: 'analyzed',
          updated_at: new Date().toISOString()
        })
        .eq('id', uploadId);

      toast({
        title: "Analysis Complete",
        description: `Gemini AI identified ${parsedAnalysis.elements.length} elements and ${parsedAnalysis.rooms.length} rooms`,
      });

      return parsedAnalysis;

    } catch (error) {
      console.error('Blueprint analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze blueprint with Gemini AI",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setAnalyzing(false);
    }
  }, [analyzeBlueprintImage, convertImageUrlToBase64, toast]);

  const generate3DModel = useCallback(async (analysis: BlueprintAnalysis, uploadId: string) => {
    setGenerating3D(true);
    try {
      console.log('Starting 3D model generation for analysis:', analysis);
      
      const generation3DResponse = await generate3DFromBlueprint(
        JSON.stringify(analysis),
        `Building type: ${analysis.buildingType}, Total area: ${analysis.totalArea} sq ft`
      );

      if (!generation3DResponse) {
        throw new Error('Failed to generate 3D model specifications');
      }

      const cleaned3DResult = stripCodeFences(generation3DResponse.result);

      let parsed3DModel: Generated3DModel;
      try {
        const jsonMatch = cleaned3DResult.match(/```json\n([\s\S]*?)\n```/) ||
                         cleaned3DResult.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          throw new Error('No JSON structure found in Gemini 3D response');
        }

        const jsonText = stripCodeFences(jsonMatch[1] || jsonMatch[0]);
        console.log('Extracted 3D model JSON:', jsonText);
        parsed3DModel = JSON.parse(jsonText);
      } catch (parseError) {
        // Gemini's 3D JSON is occasionally malformed/truncated. Fail quietly here rather
        // than fabricating a placeholder model — callers already treat a null return as
        // "no 3D model this time" without surfacing an error.
        console.warn(
          'Failed to parse Gemini 3D model JSON — skipping 3D generation:',
          parseError instanceof Error ? parseError.message : parseError
        );
        return null;
      }

      setGenerated3DModel(parsed3DModel);

      const glbData = await convertToGLB(parsed3DModel);
      const fileName = `gemini-3d-models/${uploadId}-${Date.now()}.glb`;

      const { error: uploadError } = await supabase.storage
        .from('3d-models')
        .upload(fileName, glbData, {
          contentType: 'model/gltf-binary',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { error: dbError } = await supabase
        .from('generated_3d_models')
        .insert({
          upload_id: uploadId,
          model_name: `Gemini_3D_Model_${Date.now()}`,
          model_description: `3D model generated from ${analysis.elements.length} elements and ${analysis.rooms.length} rooms`,
          model_file_path: fileName,
          file_size: glbData.byteLength,
          generation_status: 'completed',
          generation_prompt: `Gemini AI 3D generation from ${analysis.buildingType} blueprint`
        });

      if (dbError) {
        console.error('Database update error:', dbError);
        throw dbError;
      }

      toast({
        title: "3D Model Generated",
        description: "Gemini AI successfully created your 3D floor plan model",
      });

      return parsed3DModel;

    } catch (error) {
      console.error('3D model generation error:', error);
      toast({
        title: "3D Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate 3D model",
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating3D(false);
    }
  }, [generate3DFromBlueprint, toast]);

  const processBlueprint = useCallback(async (imageUrl: string, uploadId: string) => {
    console.log('Processing blueprint with enhanced Gemini analysis:', imageUrl, uploadId);
    
    const analysis = await analyzeBlueprint(imageUrl, uploadId);
    if (!analysis) return null;

    const model3D = await generate3DModel(analysis, uploadId);
    if (!model3D) return null;

    return {
      analysis,
      model3D
    };
  }, [analyzeBlueprint, generate3DModel]);

  return {
    analyzing,
    generating3D,
    blueprintAnalysis,
    generated3DModel,
    analyzeBlueprint,
    generate3DModel,
    processBlueprint
  };
};

// Helper function to convert 3D model to GLB format
async function convertToGLB(model: Generated3DModel): Promise<Uint8Array> {
  console.log('Converting 3D model to GLB format');
  
  const gltfJson = {
    asset: { version: "2.0", generator: "Gemini-CitadelTwin" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: model.scene.objects.map((obj, index) => ({
      name: obj.name,
      mesh: index,
      translation: obj.transform.position,
      rotation: obj.transform.rotation,
      scale: obj.transform.scale
    })),
    meshes: model.scene.objects.map(() => ({
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2
      }]
    })),
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: model.geometry.vertices.length / 3,
        type: "VEC3"
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteLength: model.geometry.vertices.length * 4
      }
    ],
    buffers: [
      {
        byteLength: model.geometry.vertices.length * 4
      }
    ]
  };

  const jsonString = JSON.stringify(gltfJson);
  const jsonBuffer = new TextEncoder().encode(jsonString);
  const binaryBuffer = new Float32Array(model.geometry.vertices);

  const headerSize = 12;
  const jsonChunkHeaderSize = 8;
  const binaryChunkHeaderSize = 8;
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const totalSize = headerSize + jsonChunkHeaderSize + jsonBuffer.length + jsonPadding + 
                   binaryChunkHeaderSize + binaryBuffer.byteLength;

  const glbBuffer = new ArrayBuffer(totalSize);
  const glbView = new DataView(glbBuffer);
  const glbBytes = new Uint8Array(glbBuffer);
  
  let offset = 0;

  // GLB header
  glbView.setUint32(offset, 0x46546C67, true); offset += 4;
  glbView.setUint32(offset, 2, true); offset += 4;
  glbView.setUint32(offset, totalSize, true); offset += 4;

  // JSON chunk
  glbView.setUint32(offset, jsonBuffer.length + jsonPadding, true); offset += 4;
  glbView.setUint32(offset, 0x4E4F534A, true); offset += 4;
  glbBytes.set(jsonBuffer, offset); offset += jsonBuffer.length;
  
  for (let i = 0; i < jsonPadding; i++) {
    glbBytes[offset++] = 0x20;
  }

  // Binary chunk
  glbView.setUint32(offset, binaryBuffer.byteLength, true); offset += 4;
  glbView.setUint32(offset, 0x004E4942, true); offset += 4;
  glbBytes.set(new Uint8Array(binaryBuffer.buffer), offset);

  return new Uint8Array(glbBuffer);
}
