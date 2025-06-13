
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uploadId, detectedObjects, imageUrl } = await req.json();

    console.log('Starting 3D model generation for upload:', uploadId);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a detailed prompt based on detected objects
    const objectDescriptions = detectedObjects.map((obj: any) => 
      `${obj.label} (confidence: ${(obj.confidence * 100).toFixed(1)}%)`
    ).join(', ');

    const prompt = `Generate a 3D architectural model based on a 2D blueprint containing these elements: ${objectDescriptions}. 
    Create a realistic building structure with proper proportions and architectural details. 
    The model should be suitable for architectural visualization and include structural elements like walls, doors, windows, and any detected fixtures.`;

    // Create initial 3D model record
    const { data: modelRecord, error: insertError } = await supabase
      .from('generated_3d_models')
      .insert({
        upload_id: uploadId,
        model_name: `3D_Model_${Date.now()}`,
        model_description: `3D model generated from blueprint with detected objects: ${objectDescriptions}`,
        model_file_path: '', // Will be updated after file generation
        file_size: 0, // Will be updated after file generation
        generation_status: 'generating',
        generation_prompt: prompt
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('Created 3D model record:', modelRecord.id);

    // For now, we'll simulate 3D model generation since Hunyuan3D requires specific setup
    // In a real implementation, you would integrate with Hunyuan3D API here
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate a valid GLB file based on detected objects
    const mockGLBData = generateValidGLB(detectedObjects);
    const fileName = `${uploadId}/${modelRecord.id}.glb`;

    // Upload the mock 3D model to storage
    const { error: uploadError } = await supabase.storage
      .from('3d-models')
      .upload(fileName, mockGLBData, {
        contentType: 'model/gltf-binary',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Verify the file was uploaded by checking its existence
    const { data: fileData, error: checkError } = await supabase.storage
      .from('3d-models')
      .download(fileName);

    if (checkError) {
      console.error('File verification error:', checkError);
      throw new Error('Failed to verify uploaded 3D model');
    }

    console.log('File verified, size:', fileData.size);

    // Update the model record with file information
    const { error: updateError } = await supabase
      .from('generated_3d_models')
      .update({
        model_file_path: fileName,
        file_size: fileData.size,
        generation_status: 'completed',
        processing_time_ms: 3000
      })
      .eq('id', modelRecord.id);

    if (updateError) {
      throw updateError;
    }

    console.log('3D model generation completed for upload:', uploadId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        modelId: modelRecord.id,
        message: 'Demo 3D model generated successfully. In production, this would use Hunyuan3D.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-3d-model function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Generate a valid GLB file with proper structure
function generateValidGLB(detectedObjects: any[]): Uint8Array {
  // Create a simple but valid cube geometry for demonstration
  // This generates a proper GLB 2.0 file with correct binary structure
  
  const vertices = new Float32Array([
    // Front face
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
    // Back face
    -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
    // Top face
    -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
    // Bottom face
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
    // Right face
     1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
    // Left face
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
  ]);

  const indices = new Uint16Array([
     0,  1,  2,    0,  2,  3,    // front
     4,  5,  6,    4,  6,  7,    // back
     8,  9, 10,    8, 10, 11,    // top
    12, 13, 14,   12, 14, 15,    // bottom
    16, 17, 18,   16, 18, 19,    // right
    20, 21, 22,   20, 22, 23     // left
  ]);

  const normals = new Float32Array([
    // Front face
     0,  0,  1,    0,  0,  1,    0,  0,  1,    0,  0,  1,
    // Back face
     0,  0, -1,    0,  0, -1,    0,  0, -1,    0,  0, -1,
    // Top face
     0,  1,  0,    0,  1,  0,    0,  1,  0,    0,  1,  0,
    // Bottom face
     0, -1,  0,    0, -1,  0,    0, -1,  0,    0, -1,  0,
    // Right face
     1,  0,  0,    1,  0,  0,    1,  0,  0,    1,  0,  0,
    // Left face
    -1,  0,  0,   -1,  0,  0,   -1,  0,  0,   -1,  0,  0
  ]);

  // Calculate buffer sizes
  const vertexBufferSize = vertices.byteLength;
  const normalBufferSize = normals.byteLength;
  const indexBufferSize = indices.byteLength;
  
  // Align to 4-byte boundaries
  const vertexBufferAligned = Math.ceil(vertexBufferSize / 4) * 4;
  const normalBufferAligned = Math.ceil(normalBufferSize / 4) * 4;
  const indexBufferAligned = Math.ceil(indexBufferSize / 4) * 4;
  
  const totalBinarySize = vertexBufferAligned + normalBufferAligned + indexBufferAligned;

  // Create glTF JSON
  const gltfJson = {
    asset: {
      version: "2.0",
      generator: "Blueprint-to-3D Demo Generator"
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: {
          POSITION: 0,
          NORMAL: 1
        },
        indices: 2
      }]
    }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: 24, // 24 vertices
        type: "VEC3",
        max: [1, 1, 1],
        min: [-1, -1, -1]
      },
      {
        bufferView: 1,
        componentType: 5126, // FLOAT
        count: 24, // 24 normals
        type: "VEC3"
      },
      {
        bufferView: 2,
        componentType: 5123, // UNSIGNED_SHORT
        count: 36, // 36 indices
        type: "SCALAR"
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: vertexBufferSize,
        target: 34962 // ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: vertexBufferAligned,
        byteLength: normalBufferSize,
        target: 34962 // ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: vertexBufferAligned + normalBufferAligned,
        byteLength: indexBufferSize,
        target: 34963 // ELEMENT_ARRAY_BUFFER
      }
    ],
    buffers: [{
      byteLength: totalBinarySize
    }]
  };

  // Convert JSON to buffer
  const jsonString = JSON.stringify(gltfJson);
  const jsonBuffer = new TextEncoder().encode(jsonString);
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonPaddedLength = jsonBuffer.length + jsonPadding;

  // Create binary buffer
  const binaryBuffer = new ArrayBuffer(totalBinarySize);
  const binaryView = new Uint8Array(binaryBuffer);
  
  // Copy vertex data
  binaryView.set(new Uint8Array(vertices.buffer), 0);
  
  // Copy normal data
  binaryView.set(new Uint8Array(normals.buffer), vertexBufferAligned);
  
  // Copy index data
  binaryView.set(new Uint8Array(indices.buffer), vertexBufferAligned + normalBufferAligned);

  // Calculate total GLB size
  const headerSize = 12;
  const jsonChunkHeaderSize = 8;
  const binaryChunkHeaderSize = 8;
  const totalSize = headerSize + jsonChunkHeaderSize + jsonPaddedLength + binaryChunkHeaderSize + totalBinarySize;

  // Create final GLB buffer
  const glbBuffer = new ArrayBuffer(totalSize);
  const glbView = new DataView(glbBuffer);
  const glbBytes = new Uint8Array(glbBuffer);
  
  let offset = 0;

  // GLB header
  glbView.setUint32(offset, 0x46546C67, true); offset += 4; // "glTF"
  glbView.setUint32(offset, 2, true); offset += 4; // version
  glbView.setUint32(offset, totalSize, true); offset += 4; // total length

  // JSON chunk header
  glbView.setUint32(offset, jsonPaddedLength, true); offset += 4;
  glbView.setUint32(offset, 0x4E4F534A, true); offset += 4; // "JSON"
  
  // JSON chunk data
  glbBytes.set(jsonBuffer, offset);
  offset += jsonBuffer.length;
  
  // Add JSON padding (spaces)
  for (let i = 0; i < jsonPadding; i++) {
    glbBytes[offset++] = 0x20; // space character
  }

  // Binary chunk header
  glbView.setUint32(offset, totalBinarySize, true); offset += 4;
  glbView.setUint32(offset, 0x004E4942, true); offset += 4; // "BIN\0"
  
  // Binary chunk data
  glbBytes.set(binaryView, offset);

  return new Uint8Array(glbBuffer);
}
