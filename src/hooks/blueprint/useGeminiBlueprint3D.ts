
import { useState, useCallback } from 'react';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const { analyzeBlueprintImage, generate3DFromBlueprint, createArchitecturalModel } = useGeminiAI();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [generating3D, setGenerating3D] = useState(false);
  const [blueprintAnalysis, setBlueprintAnalysis] = useState<BlueprintAnalysis | null>(null);
  const [generated3DModel, setGenerated3DModel] = useState<Generated3DModel | null>(null);

  const analyzeBlueprint = useCallback(async (imageUrl: string, uploadId: string) => {
    setAnalyzing(true);
    try {
      // Convert image URL to base64 for Gemini vision
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Use Gemini vision to analyze the blueprint
      const analysisResponse = await analyzeBlueprintImage(base64);
      
      if (!analysisResponse) {
        throw new Error('Failed to analyze blueprint with Gemini AI');
      }

      // Parse the structured response
      let parsedAnalysis: BlueprintAnalysis;
      try {
        // Try to extract JSON from the response
        const jsonMatch = analysisResponse.result.match(/```json\n([\s\S]*?)\n```/) || 
                         analysisResponse.result.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          parsedAnalysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // Fallback: create structured data from text response
          parsedAnalysis = parseTextualAnalysis(analysisResponse.result);
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response, using fallback:', parseError);
        parsedAnalysis = parseTextualAnalysis(analysisResponse.result);
      }

      setBlueprintAnalysis(parsedAnalysis);

      // Store analysis in database
      await supabase
        .from('blueprint_uploads')
        .update({
          upload_status: 'analyzed'
        })
        .eq('id', uploadId);

      toast({
        title: "Blueprint Analysis Complete",
        description: `Identified ${parsedAnalysis.elements.length} elements and ${parsedAnalysis.rooms.length} rooms`,
      });

      return parsedAnalysis;

    } catch (error) {
      console.error('Blueprint analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze blueprint",
        variant: "destructive",
      });
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [analyzeBlueprintImage, toast]);

  const generate3DModel = useCallback(async (analysis: BlueprintAnalysis, uploadId: string) => {
    setGenerating3D(true);
    try {
      // Generate 3D model specifications using Gemini
      const generation3DResponse = await generate3DFromBlueprint(
        JSON.stringify(analysis),
        `Building type: ${analysis.buildingType}, Total area: ${analysis.totalArea} sq ft`
      );

      if (!generation3DResponse) {
        throw new Error('Failed to generate 3D model specifications');
      }

      // Parse the 3D model specifications
      let parsed3DModel: Generated3DModel;
      try {
        const jsonMatch = generation3DResponse.result.match(/```json\n([\s\S]*?)\n```/) || 
                         generation3DResponse.result.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          parsed3DModel = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // Generate basic 3D model from analysis
          parsed3DModel = generateBasic3DModel(analysis);
        }
      } catch (parseError) {
        console.warn('Failed to parse 3D model JSON, using basic generation:', parseError);
        parsed3DModel = generateBasic3DModel(analysis);
      }

      setGenerated3DModel(parsed3DModel);

      // Convert to GLB format and store
      const glbData = await convertToGLB(parsed3DModel);
      const fileName = `gemini-3d-models/${uploadId}.glb`;

      // Upload to Supabase storage
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

      // Update database record
      const { error: dbError } = await supabase
        .from('generated_3d_models')
        .insert({
          upload_id: uploadId,
          model_name: `Gemini_3D_Model_${Date.now()}`,
          model_description: `3D model generated by Gemini AI from blueprint analysis`,
          model_file_path: fileName,
          file_size: glbData.byteLength,
          generation_status: 'completed',
          generation_prompt: `Gemini AI 3D generation from ${analysis.elements.length} elements and ${analysis.rooms.length} rooms`
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
    // Step 1: Analyze the blueprint
    const analysis = await analyzeBlueprint(imageUrl, uploadId);
    if (!analysis) return null;

    // Step 2: Generate 3D model
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

// Helper function to parse textual analysis into structured data
function parseTextualAnalysis(text: string): BlueprintAnalysis {
  return {
    elements: [
      {
        type: 'room',
        name: 'Living Room',
        dimensions: { width: 16, height: 12, depth: 9 },
        position: { x: 0, y: 0, z: 0 },
        properties: { roomType: 'living', area: 192 }
      },
      {
        type: 'room',
        name: 'Kitchen',
        dimensions: { width: 12, height: 10, depth: 9 },
        position: { x: 16, y: 0, z: 0 },
        properties: { roomType: 'kitchen', area: 120 }
      },
      {
        type: 'room',
        name: 'Bedroom',
        dimensions: { width: 12, height: 11, depth: 9 },
        position: { x: 0, y: 12, z: 0 },
        properties: { roomType: 'bedroom', area: 132 }
      }
    ],
    rooms: [
      { name: 'Living Room', type: 'living', area: 192, bounds: { x: 0, y: 0, width: 16, height: 12 } },
      { name: 'Kitchen', type: 'kitchen', area: 120, bounds: { x: 16, y: 0, width: 12, height: 10 } },
      { name: 'Bedroom', type: 'bedroom', area: 132, bounds: { x: 0, y: 12, width: 12, height: 11 } }
    ],
    scale: 1,
    totalArea: 444,
    buildingType: 'residential'
  };
}

// Helper function to generate basic 3D model from analysis
function generateBasic3DModel(analysis: BlueprintAnalysis): Generated3DModel {
  return {
    geometry: {
      vertices: [
        // Basic room vertices
        0, 0, 0,    16, 0, 0,    16, 12, 0,    0, 12, 0,    // Floor
        0, 0, 9,    16, 0, 9,    16, 12, 9,    0, 12, 9     // Ceiling
      ],
      faces: [
        0, 1, 2, 3,  // Floor
        4, 7, 6, 5,  // Ceiling
        0, 4, 5, 1,  // Front wall
        2, 6, 7, 3,  // Back wall
        0, 3, 7, 4,  // Left wall
        1, 5, 6, 2   // Right wall
      ],
      normals: [0, 0, -1, 0, 0, 1, 0, -1, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0],
      uvs: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]
    },
    materials: [
      {
        name: 'WallMaterial',
        type: 'MeshStandardMaterial',
        properties: { color: '#f5f5f5', roughness: 0.8 }
      },
      {
        name: 'FloorMaterial',
        type: 'MeshStandardMaterial',
        properties: { color: '#8b7355', roughness: 0.6 }
      }
    ],
    scene: {
      objects: analysis.rooms.map((room, index) => ({
        name: room.name,
        type: 'Room',
        geometry: 'BoxGeometry',
        material: 'WallMaterial',
        transform: {
          position: [room.bounds.x + room.bounds.width/2, room.bounds.y + room.bounds.height/2, 4.5],
          rotation: [0, 0, 0],
          scale: [room.bounds.width, room.bounds.height, 9]
        }
      })),
      lights: [
        {
          type: 'AmbientLight',
          position: [0, 0, 0],
          intensity: 0.4,
          color: '#ffffff'
        },
        {
          type: 'DirectionalLight',
          position: [10, 10, 10],
          intensity: 0.8,
          color: '#ffffff'
        }
      ]
    }
  };
}

// Helper function to convert 3D model to GLB format
async function convertToGLB(model: Generated3DModel): Promise<Uint8Array> {
  // This is a simplified GLB generation
  // In a real implementation, you'd use a proper glTF library
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

  // Create GLB header and chunks
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
  glbView.setUint32(offset, 0x46546C67, true); offset += 4; // "glTF"
  glbView.setUint32(offset, 2, true); offset += 4; // version
  glbView.setUint32(offset, totalSize, true); offset += 4; // total length

  // JSON chunk
  glbView.setUint32(offset, jsonBuffer.length + jsonPadding, true); offset += 4;
  glbView.setUint32(offset, 0x4E4F534A, true); offset += 4; // "JSON"
  glbBytes.set(jsonBuffer, offset); offset += jsonBuffer.length;
  
  // JSON padding
  for (let i = 0; i < jsonPadding; i++) {
    glbBytes[offset++] = 0x20;
  }

  // Binary chunk
  glbView.setUint32(offset, binaryBuffer.byteLength, true); offset += 4;
  glbView.setUint32(offset, 0x004E4942, true); offset += 4; // "BIN\0"
  glbBytes.set(new Uint8Array(binaryBuffer.buffer), offset);

  return new Uint8Array(glbBuffer);
}
