import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Blueprint 3D processing started");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the form data with the uploaded file
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    // Optional: caller can pass an existing blueprint upload_id to link models
    const existingUploadId = formData.get("upload_id") as string | null;

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes, upload_id: ${existingUploadId || 'none'}`);

    // Convert image to base64 for AI analysis
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Image = btoa(binary);
    const mimeType = file.type || 'image/png';

    console.log("Sending image to Lovable AI for room detection...");

    // Use Lovable AI with tool calling to extract structured room data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert architectural floor plan analyzer. Analyze the provided floor plan image and detect all rooms, walls, doors, and windows. For each room, estimate its dimensions in meters based on the scale shown or typical residential proportions. Return structured data using the provided tool.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this floor plan. Detect all rooms with their types, positions (x,y in pixels from top-left), dimensions (width and depth in pixels), and any walls, doors, and windows you can identify. Use realistic proportions."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "detect_floor_plan_elements",
              description: "Return all detected rooms, walls, doors, and windows from the floor plan",
              parameters: {
                type: "object",
                properties: {
                  rooms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Room type: bedroom, bathroom, kitchen, living_room, dining_room, office, garage, hallway, foyer, pantry, closet, laundry, porch, storage" },
                        name: { type: "string", description: "Room name as shown on the plan, e.g. 'Master Bedroom', 'Bath #2'" },
                        confidence: { type: "number", description: "Detection confidence 0-1" },
                        bbox: {
                          type: "object",
                          properties: {
                            x: { type: "number", description: "X position in pixels from left" },
                            y: { type: "number", description: "Y position in pixels from top" },
                            width: { type: "number", description: "Width in pixels" },
                            height: { type: "number", description: "Height in pixels" }
                          },
                          required: ["x", "y", "width", "height"]
                        },
                        width_m: { type: "number", description: "Estimated real-world width in meters" },
                        depth_m: { type: "number", description: "Estimated real-world depth in meters" },
                        area_m2: { type: "number", description: "Estimated area in square meters" }
                      },
                      required: ["label", "name", "confidence", "bbox", "width_m", "depth_m", "area_m2"]
                    }
                  },
                  walls: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", enum: ["exterior_wall", "interior_wall", "load_bearing_wall"] },
                        confidence: { type: "number" },
                        bbox: {
                          type: "object",
                          properties: {
                            x: { type: "number" }, y: { type: "number" },
                            width: { type: "number" }, height: { type: "number" }
                          },
                          required: ["x", "y", "width", "height"]
                        }
                      },
                      required: ["label", "confidence", "bbox"]
                    }
                  },
                  doors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", enum: ["door", "front_door", "main_entrance", "garage_door"] },
                        confidence: { type: "number" },
                        bbox: {
                          type: "object",
                          properties: {
                            x: { type: "number" }, y: { type: "number" },
                            width: { type: "number" }, height: { type: "number" }
                          },
                          required: ["x", "y", "width", "height"]
                        }
                      },
                      required: ["label", "confidence", "bbox"]
                    }
                  },
                  windows: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        confidence: { type: "number" },
                        bbox: {
                          type: "object",
                          properties: {
                            x: { type: "number" }, y: { type: "number" },
                            width: { type: "number" }, height: { type: "number" }
                          },
                          required: ["x", "y", "width", "height"]
                        }
                      },
                      required: ["label", "confidence", "bbox"]
                    }
                  },
                  building_info: {
                    type: "object",
                    properties: {
                      total_area_sqft: { type: "number" },
                      building_type: { type: "string" },
                      num_floors: { type: "number" }
                    }
                  }
                },
                required: ["rooms", "walls", "doors", "windows"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "detect_floor_plan_elements" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) throw new Error("AI rate limited. Please try again in a moment.");
      if (aiResponse.status === 402) throw new Error("AI credits exhausted. Please add credits.");
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      throw new Error("AI did not return structured room data");
    }

    const detectedElements = JSON.parse(toolCall.function.arguments);
    console.log(`AI detected: ${detectedElements.rooms?.length || 0} rooms, ${detectedElements.walls?.length || 0} walls, ${detectedElements.doors?.length || 0} doors, ${detectedElements.windows?.length || 0} windows`);

    // Combine all detected objects for 3D generation
    const allDetectedObjects = [
      ...(detectedElements.rooms || []),
      ...(detectedElements.walls || []),
      ...(detectedElements.doors || []),
      ...(detectedElements.windows || []),
    ];

    // Generate GLB 3D model from detected elements
    // Use caller-supplied upload_id or generate a new one
    const modelUploadId = existingUploadId || crypto.randomUUID();
    const timestamp = Date.now();

    const glbData = generateGLBFromDetections(detectedElements, modelUploadId);
    const fileName = `${modelUploadId}/${timestamp}.glb`;

    console.log("Uploading GLB to storage, size:", glbData.length);

    // Upload GLB to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("3d-models")
      .upload(fileName, glbData, {
        contentType: "model/gltf-binary",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error("Failed to upload 3D model");
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("3d-models")
      .getPublicUrl(fileName);

    const glbUrl = urlData.publicUrl;
    console.log("GLB uploaded:", glbUrl);

    // ---- Save record to generated_3d_models so dashboard 3D viewer can find it ----
    const roomCount = detectedElements.rooms?.length || 0;
    const buildingType = detectedElements.building_info?.building_type || 'Building';
    const modelName = `${buildingType} - ${roomCount} Rooms`;
    const modelDescription = `AI-generated 3D model from blueprint. ${roomCount} rooms detected.`;

    const { data: savedModel, error: saveError } = await supabase
      .from('generated_3d_models')
      .insert({
        upload_id: modelUploadId,
        model_name: modelName,
        model_description: modelDescription,
        model_file_path: fileName,
        generation_status: 'completed',
        file_size: glbData.length,
        generation_prompt: `AI floor plan analysis: ${roomCount} rooms`,
        processing_time_ms: Date.now() - timestamp,
      })
      .select('id')
      .single();

    if (saveError) {
      // Non-fatal: log but continue — model is uploaded, just won't appear in dashboard
      console.error("Warning: failed to save generated_3d_models record:", saveError.message);
    } else {
      console.log("Saved generated_3d_models record:", savedModel?.id);
    }
    // ---------------------------------------------------------------------------------

    // Build detections array for frontend
    const detections = (detectedElements.rooms || []).map((room: any) => ({
      class: `space_${room.label}`,
      name: room.name,
      confidence: room.confidence,
      width_m: room.width_m?.toFixed(1),
      depth_m: room.depth_m?.toFixed(1),
      area_m2: room.area_m2?.toFixed(1),
      bbox: room.bbox,
    }));

    // Generate simple HTML visualization
    const htmlView = generateHTMLVisualization(detectedElements);

    return new Response(
      JSON.stringify({
        status: "success",
        glb_url: glbUrl,
        html_view: htmlView,
        detections,
        building_info: detectedElements.building_info || {},
        model_record_id: savedModel?.id || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing blueprint:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ==================== GLB Generation ====================

function generateGLBFromDetections(elements: any, uploadId: string): Uint8Array {
  const rooms = elements.rooms || [];
  const walls = elements.walls || [];
  const doors = elements.doors || [];
  const windows = elements.windows || [];

  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let vertexIndex = 0;

  const scale = 0.05; // Scale blueprint pixels to 3D meters

  // Calculate building bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const allElements = [...rooms, ...walls, ...doors, ...windows];
  allElements.forEach((el: any) => {
    if (el.bbox) {
      minX = Math.min(minX, el.bbox.x);
      minY = Math.min(minY, el.bbox.y);
      maxX = Math.max(maxX, el.bbox.x + el.bbox.width);
      maxY = Math.max(maxY, el.bbox.y + el.bbox.height);
    }
  });

  const centerOffsetX = (minX + maxX) / 2;
  const centerOffsetY = (minY + maxY) / 2;

  // Generate room geometries
  rooms.forEach((room: any, i: number) => {
    const bbox = room.bbox;
    const cx = (bbox.x + bbox.width / 2 - centerOffsetX) * scale;
    const cz = (bbox.y + bbox.height / 2 - centerOffsetY) * scale;
    const w = bbox.width * scale;
    const d = bbox.height * scale;
    const h = getRoomHeight(room.label);

    // Floor
    addQuad(vertices, normals, indices, vertexIndex,
      [cx - w/2, 0, cz - d/2], [cx + w/2, 0, cz - d/2],
      [cx + w/2, 0, cz + d/2], [cx - w/2, 0, cz + d/2],
      [0, 1, 0]);
    vertexIndex += 4;

    // 4 walls
    addQuad(vertices, normals, indices, vertexIndex,
      [cx - w/2, 0, cz - d/2], [cx + w/2, 0, cz - d/2],
      [cx + w/2, h, cz - d/2], [cx - w/2, h, cz - d/2],
      [0, 0, -1]);
    vertexIndex += 4;

    addQuad(vertices, normals, indices, vertexIndex,
      [cx + w/2, 0, cz + d/2], [cx - w/2, 0, cz + d/2],
      [cx - w/2, h, cz + d/2], [cx + w/2, h, cz + d/2],
      [0, 0, 1]);
    vertexIndex += 4;

    addQuad(vertices, normals, indices, vertexIndex,
      [cx + w/2, 0, cz - d/2], [cx + w/2, 0, cz + d/2],
      [cx + w/2, h, cz + d/2], [cx + w/2, h, cz - d/2],
      [1, 0, 0]);
    vertexIndex += 4;

    addQuad(vertices, normals, indices, vertexIndex,
      [cx - w/2, 0, cz + d/2], [cx - w/2, 0, cz - d/2],
      [cx - w/2, h, cz - d/2], [cx - w/2, h, cz + d/2],
      [-1, 0, 0]);
    vertexIndex += 4;

    // Ceiling
    addQuad(vertices, normals, indices, vertexIndex,
      [cx - w/2, h, cz + d/2], [cx + w/2, h, cz + d/2],
      [cx + w/2, h, cz - d/2], [cx - w/2, h, cz - d/2],
      [0, -1, 0]);
    vertexIndex += 4;
  });

  // Generate foundation slab
  if (allElements.length > 0) {
    const bw = (maxX - minX) * scale + 2;
    const bd = (maxY - minY) * scale + 2;
    addQuad(vertices, normals, indices, vertexIndex,
      [-bw/2, -0.2, -bd/2], [bw/2, -0.2, -bd/2],
      [bw/2, -0.2, bd/2], [-bw/2, -0.2, bd/2],
      [0, -1, 0]);
    vertexIndex += 4;
    addQuad(vertices, normals, indices, vertexIndex,
      [-bw/2, 0, bd/2], [bw/2, 0, bd/2],
      [bw/2, 0, -bd/2], [-bw/2, 0, -bd/2],
      [0, 1, 0]);
    vertexIndex += 4;
  }

  // Build GLB binary
  return buildGLB(vertices, normals, indices);
}

function addQuad(
  vertices: number[], normals: number[], indices: number[], baseIndex: number,
  v0: number[], v1: number[], v2: number[], v3: number[],
  normal: number[]
) {
  vertices.push(...v0, ...v1, ...v2, ...v3);
  normals.push(...normal, ...normal, ...normal, ...normal);
  indices.push(
    baseIndex, baseIndex + 1, baseIndex + 2,
    baseIndex, baseIndex + 2, baseIndex + 3
  );
}

function getRoomHeight(label: string): number {
  if (label.includes('garage')) return 3.0;
  if (label.includes('bathroom') || label.includes('bath')) return 2.4;
  if (label.includes('living') || label.includes('great')) return 3.2;
  if (label.includes('foyer') || label.includes('porch')) return 3.0;
  return 2.7;
}

function buildGLB(vertices: number[], normals: number[], indices: number[]): Uint8Array {
  const verticesArray = new Float32Array(vertices);
  const normalsArray = new Float32Array(normals);
  const indicesArray = new Uint16Array(indices);

  const vertexBufSize = verticesArray.byteLength;
  const normalBufSize = normalsArray.byteLength;
  const indexBufSize = indicesArray.byteLength;

  const vertexAligned = Math.ceil(vertexBufSize / 4) * 4;
  const normalAligned = Math.ceil(normalBufSize / 4) * 4;
  const indexAligned = Math.ceil(indexBufSize / 4) * 4;
  const totalBinary = vertexAligned + normalAligned + indexAligned;

  // Compute min/max for accessor
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < vertices.length; i += 3) {
    minX = Math.min(minX, vertices[i]);
    minY = Math.min(minY, vertices[i+1]);
    minZ = Math.min(minZ, vertices[i+2]);
    maxX = Math.max(maxX, vertices[i]);
    maxY = Math.max(maxY, vertices[i+1]);
    maxZ = Math.max(maxZ, vertices[i+2]);
  }

  const gltfJson = {
    asset: { version: "2.0", generator: "CitadelTwin AI" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2 }] }],
    accessors: [
      {
        bufferView: 0, componentType: 5126, count: verticesArray.length / 3,
        type: "VEC3", max: [maxX, maxY, maxZ], min: [minX, minY, minZ]
      },
      { bufferView: 1, componentType: 5126, count: normalsArray.length / 3, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: indicesArray.length, type: "SCALAR" }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: vertexBufSize, target: 34962 },
      { buffer: 0, byteOffset: vertexAligned, byteLength: normalBufSize, target: 34962 },
      { buffer: 0, byteOffset: vertexAligned + normalAligned, byteLength: indexBufSize, target: 34963 }
    ],
    buffers: [{ byteLength: totalBinary }]
  };

  const jsonStr = JSON.stringify(gltfJson);
  const jsonBuf = new TextEncoder().encode(jsonStr);
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
  const jsonPaddedLen = jsonBuf.length + jsonPad;

  const headerSize = 12;
  const chunkHeaderSize = 8;
  const totalSize = headerSize + chunkHeaderSize + jsonPaddedLen + chunkHeaderSize + totalBinary;

  const glb = new ArrayBuffer(totalSize);
  const view = new DataView(glb);
  const bytes = new Uint8Array(glb);

  let off = 0;
  view.setUint32(off, 0x46546C67, true); off += 4; // glTF
  view.setUint32(off, 2, true); off += 4;
  view.setUint32(off, totalSize, true); off += 4;

  view.setUint32(off, jsonPaddedLen, true); off += 4;
  view.setUint32(off, 0x4E4F534A, true); off += 4; // JSON
  bytes.set(jsonBuf, off); off += jsonBuf.length;
  for (let i = 0; i < jsonPad; i++) bytes[off++] = 0x20;

  view.setUint32(off, totalBinary, true); off += 4;
  view.setUint32(off, 0x004E4942, true); off += 4; // BIN
  const binBuf = new Uint8Array(totalBinary);
  binBuf.set(new Uint8Array(verticesArray.buffer), 0);
  binBuf.set(new Uint8Array(normalsArray.buffer), vertexAligned);
  binBuf.set(new Uint8Array(indicesArray.buffer), vertexAligned + normalAligned);
  bytes.set(binBuf, off);

  return new Uint8Array(glb);
}

// ==================== HTML Visualization ====================

function generateHTMLVisualization(elements: any): string {
  const rooms = elements.rooms || [];
  const colors: Record<string, string> = {
    bedroom: '#AEC6CF', bathroom: '#FFB347', kitchen: '#FDFD96',
    living_room: '#FFB6C1', dining_room: '#B19CD9', office: '#77DD77',
    garage: '#CFCFC4', hallway: '#D3D3D3', foyer: '#DEB887',
    pantry: '#F0E68C', closet: '#E6E6FA', laundry: '#87CEEB',
    porch: '#98FB98', storage: '#C0C0C0',
  };

  const roomDivs = rooms.map((room: any, i: number) => {
    const color = colors[room.label] || '#DDD';
    return `<div style="position:absolute;left:${room.bbox.x * 0.4}px;top:${room.bbox.y * 0.4}px;width:${room.bbox.width * 0.4}px;height:${room.bbox.height * 0.4}px;background:${color}88;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:#333;text-align:center;border-radius:4px;" title="${room.name}: ${room.width_m}m × ${room.depth_m}m (${room.area_m2}m²)">${room.name || room.label}<br/>${room.width_m}×${room.depth_m}m</div>`;
  }).join('');

  return `<div style="position:relative;width:100%;min-height:500px;background:#f8f8f8;overflow:auto;padding:20px;">
    <h3 style="margin:0 0 10px;font-size:16px;color:#333;">Floor Plan Analysis — ${rooms.length} rooms detected</h3>
    <div style="position:relative;border:1px solid #ccc;background:#fff;display:inline-block;min-width:400px;min-height:300px;">
      ${roomDivs}
    </div>
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;">
      ${Object.entries(colors).map(([type, color]) => 
        `<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;"><span style="width:12px;height:12px;background:${color};border-radius:2px;display:inline-block;"></span>${type}</span>`
      ).join('')}
    </div>
  </div>`;
}
