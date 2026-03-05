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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const existingUploadId = formData.get("upload_id") as string | null;
    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // Convert image to base64
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Image = btoa(binary);
    const mimeType = file.type || 'image/png';

    console.log("Sending image to Lovable AI for detailed room detection...");

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
            content: `You are an expert architectural floor plan analyzer. Analyze the provided floor plan image with maximum precision.

Key rules:
1. Detect ALL rooms, their precise bounding boxes (x, y, width, height in pixels from top-left)
2. Estimate real-world dimensions using the scale bar if visible, otherwise use typical residential proportions (a standard bedroom is ~3.5m x 4m, a bathroom ~2m x 2.5m, living room ~5m x 6m)
3. Identify wall thickness (typically 15-30cm for interior, 20-40cm for exterior)
4. Detect doors (typically 0.9m wide) and windows
5. Note the total building footprint and orientation
6. Be as accurate as possible with bounding boxes - they should tightly fit each room`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this floor plan carefully. Return precise pixel bounding boxes for each room and accurate real-world dimensions."
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` }
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
                  image_width_px: { type: "number", description: "Estimated total image width in pixels" },
                  image_height_px: { type: "number", description: "Estimated total image height in pixels" },
                  scale_pixels_per_meter: { type: "number", description: "Pixels per meter if scale is visible, otherwise estimate" },
                  rooms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Room type: bedroom, master_bedroom, bathroom, kitchen, living_room, dining_room, office, garage, hallway, foyer, pantry, closet, laundry, porch, storage, utility" },
                        name: { type: "string", description: "Room name as shown on plan" },
                        confidence: { type: "number", description: "Detection confidence 0-1" },
                        bbox: {
                          type: "object",
                          properties: {
                            x: { type: "number" }, y: { type: "number" },
                            width: { type: "number" }, height: { type: "number" }
                          },
                          required: ["x", "y", "width", "height"]
                        },
                        width_m: { type: "number", description: "Real-world width in meters" },
                        depth_m: { type: "number", description: "Real-world depth in meters" },
                        area_m2: { type: "number", description: "Area in square meters" }
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
                          properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } },
                          required: ["x", "y", "width", "height"]
                        },
                        thickness_m: { type: "number", description: "Wall thickness in meters, typically 0.1-0.4" }
                      },
                      required: ["label", "confidence", "bbox"]
                    }
                  },
                  doors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        confidence: { type: "number" },
                        bbox: {
                          type: "object",
                          properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } },
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
                          properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } },
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
                      num_floors: { type: "number" },
                      wall_thickness_m: { type: "number" }
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
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured room data");

    const detectedElements = JSON.parse(toolCall.function.arguments);
    console.log(`AI detected: ${detectedElements.rooms?.length || 0} rooms, ${detectedElements.walls?.length || 0} walls`);

    const timestamp = Date.now();

    // Create blueprint_uploads record if needed
    let modelUploadId = existingUploadId;
    if (!modelUploadId) {
      const placeholderPath = `anonymous/${timestamp}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
      await supabase.storage.from('blueprints').upload(placeholderPath, await file.arrayBuffer(), {
        contentType: file.type || 'image/png', upsert: true,
      });

      const SERVICE_USER_ID = '00000000-0000-0000-0000-000000000000';
      const { data: bpRow, error: bpInsertErr } = await supabase
        .from('blueprint_uploads')
        .insert({
          user_id: SERVICE_USER_ID,
          filename: `${timestamp}_${file.name}`,
          original_filename: file.name,
          storage_path: placeholderPath,
          file_type: file.type?.split('/')[1]?.toUpperCase() || 'PNG',
          file_size: file.size,
          upload_status: 'completed',
        })
        .select('id').single();

      modelUploadId = bpInsertErr ? crypto.randomUUID() : bpRow!.id;
    }

    // Generate GLB with per-room color materials
    const glbData = generateGLBFromDetections(detectedElements, modelUploadId);
    const fileName = `${modelUploadId}/${timestamp}.glb`;

    const { error: uploadError } = await supabase.storage
      .from("3d-models")
      .upload(fileName, glbData, { contentType: "model/gltf-binary", upsert: true });

    if (uploadError) throw new Error("Failed to upload 3D model");

    const { data: urlData } = supabase.storage.from("3d-models").getPublicUrl(fileName);
    const glbUrl = urlData.publicUrl;

    const roomCount = detectedElements.rooms?.length || 0;
    const buildingType = detectedElements.building_info?.building_type || 'Building';

    const { data: savedModel } = await supabase
      .from('generated_3d_models')
      .insert({
        upload_id: modelUploadId,
        model_name: `${buildingType} - ${roomCount} Rooms`,
        model_description: `AI-generated 3D model. ${roomCount} rooms detected with color-coded materials.`,
        model_file_path: fileName,
        generation_status: 'completed',
        file_size: glbData.length,
        generation_prompt: `AI floor plan analysis: ${roomCount} rooms`,
        processing_time_ms: Date.now() - timestamp,
      })
      .select('id').single();

    const detections = (detectedElements.rooms || []).map((room: any) => ({
      class: `space_${room.label}`,
      name: room.name,
      confidence: room.confidence,
      width_m: room.width_m?.toFixed(1),
      depth_m: room.depth_m?.toFixed(1),
      area_m2: room.area_m2?.toFixed(1),
      bbox: room.bbox,
      label: room.label,
    }));

    const htmlView = generateHTMLVisualization(detectedElements);

    return new Response(
      JSON.stringify({
        status: "success",
        glb_url: glbUrl,
        html_view: htmlView,
        detections,
        building_info: detectedElements.building_info || {},
        model_record_id: savedModel?.id || null,
        room_colors: ROOM_COLORS_HEX,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing blueprint:", error);
    return new Response(
      JSON.stringify({ status: "error", error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== Room Color System ====================

// Each room type gets a distinct, high-contrast color (linear RGB 0-1 for GLB materials)
const ROOM_COLORS: Record<string, [number, number, number]> = {
  bedroom:        [0.47, 0.71, 0.91],  // steel blue
  master_bedroom: [0.27, 0.51, 0.82],  // royal blue
  bathroom:       [0.22, 0.75, 0.80],  // teal
  kitchen:        [0.95, 0.77, 0.18],  // golden yellow
  living_room:    [0.35, 0.75, 0.51],  // fresh green
  dining_room:    [0.91, 0.50, 0.22],  // warm orange
  office:         [0.58, 0.44, 0.86],  // purple
  garage:         [0.60, 0.60, 0.62],  // medium grey
  hallway:        [0.82, 0.82, 0.80],  // light warm grey
  foyer:          [0.90, 0.78, 0.56],  // warm beige
  pantry:         [0.80, 0.65, 0.35],  // tan
  closet:         [0.85, 0.78, 0.92],  // lavender
  laundry:        [0.45, 0.85, 0.90],  // sky blue
  porch:          [0.55, 0.82, 0.45],  // light green
  storage:        [0.70, 0.68, 0.65],  // warm grey
  utility:        [0.72, 0.58, 0.42],  // brown
};

const ROOM_COLORS_HEX: Record<string, string> = {
  bedroom: '#78B6E8', master_bedroom: '#4582D1', bathroom: '#38C0CC',
  kitchen: '#F2C42E', living_room: '#59BF82', dining_room: '#E87F37',
  office: '#9470DB', garage: '#9999A0', hallway: '#D1D1CC',
  foyer: '#E6C78E', pantry: '#CCAA59', closet: '#D9C7EB',
  laundry: '#73D9E6', porch: '#8CD173', storage: '#B3AFA5',
  utility: '#B8945B',
};

function getRoomColor(label: string): [number, number, number] {
  const key = label.toLowerCase().replace(/\s+/g, '_');
  return ROOM_COLORS[key] || [0.75, 0.75, 0.75];
}

function getRoomHeight(label: string): number {
  const l = label.toLowerCase();
  if (l.includes('garage')) return 3.0;
  if (l.includes('bathroom') || l.includes('bath')) return 2.4;
  if (l.includes('living') || l.includes('great') || l.includes('lounge')) return 3.2;
  if (l.includes('foyer') || l.includes('porch') || l.includes('entry')) return 3.0;
  if (l.includes('storage') || l.includes('closet') || l.includes('pantry')) return 2.2;
  return 2.7;
}

// ==================== GLB Generation with Per-Room Materials ====================

function generateGLBFromDetections(elements: any, uploadId: string): Uint8Array {
  const rooms = elements.rooms || [];
  const scale = 0.05;

  // Calculate center offset
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rooms.forEach((r: any) => {
    if (r.bbox) {
      minX = Math.min(minX, r.bbox.x);
      minY = Math.min(minY, r.bbox.y);
      maxX = Math.max(maxX, r.bbox.x + r.bbox.width);
      maxY = Math.max(maxY, r.bbox.y + r.bbox.height);
    }
  });
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 400; maxY = 400; }
  const centerOffsetX = (minX + maxX) / 2;
  const centerOffsetY = (minY + maxY) / 2;

  // Each room is its own mesh/primitive with its own material
  // GLTF structure: one node per room
  const meshes: any[] = [];
  const materials: any[] = [];
  const accessors: any[] = [];
  const bufferViews: any[] = [];
  const nodes: number[] = [];

  // Binary buffer accumulator
  const bufferChunks: Uint8Array[] = [];
  let bufferOffset = 0;

  function addBufferView(data: Uint8Array, target: number): number {
    const idx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: bufferOffset, byteLength: data.byteLength, target });
    bufferChunks.push(data);
    bufferOffset += data.byteLength;
    // Align to 4 bytes
    const pad = (4 - (data.byteLength % 4)) % 4;
    if (pad > 0) {
      bufferChunks.push(new Uint8Array(pad));
      bufferOffset += pad;
    }
    return idx;
  }

  // Foundation slab (dark grey)
  {
    const bw = (maxX - minX) * scale + 2;
    const bd = (maxY - minY) * scale + 2;
    const verts = new Float32Array([
      -bw/2, -0.25, -bd/2,   bw/2, -0.25, -bd/2,   bw/2, -0.25,  bd/2,  -bw/2, -0.25,  bd/2,
      -bw/2,  0.00,  bd/2,   bw/2,  0.00,  bd/2,   bw/2,  0.00, -bd/2,  -bw/2,  0.00, -bd/2,
    ]);
    const norms = new Float32Array([
      0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
      0,1,0, 0,1,0, 0,1,0, 0,1,0,
    ]);
    const idxs = new Uint16Array([0,1,2, 0,2,3, 4,5,6, 4,6,7]);
    const vi = addBufferView(new Uint8Array(verts.buffer), 34962);
    const ni = addBufferView(new Uint8Array(norms.buffer), 34962);
    const ii = addBufferView(new Uint8Array(idxs.buffer), 34963);
    const posAcc = accessors.length;
    accessors.push({ bufferView: vi, componentType: 5126, count: 8, type: "VEC3" });
    accessors.push({ bufferView: ni, componentType: 5126, count: 8, type: "VEC3" });
    const idxAcc = accessors.length;
    accessors.push({ bufferView: ii, componentType: 5123, count: 12, type: "SCALAR" });
    const matIdx = materials.length;
    materials.push({ name: "foundation", pbrMetallicRoughness: { baseColorFactor: [0.22, 0.22, 0.24, 1.0], metallicFactor: 0.1, roughnessFactor: 0.8 } });
    const meshIdx = meshes.length;
    meshes.push({ name: "foundation", primitives: [{ attributes: { POSITION: posAcc, NORMAL: posAcc+1 }, indices: idxAcc, material: matIdx }] });
    nodes.push(meshIdx);
  }

  // Generate each room as separate mesh with distinct material + color
  rooms.forEach((room: any, i: number) => {
    const bbox = room.bbox;
    const cx = (bbox.x + bbox.width / 2 - centerOffsetX) * scale;
    const cz = (bbox.y + bbox.height / 2 - centerOffsetY) * scale;
    const w = Math.max(bbox.width * scale, 0.5);
    const d = Math.max(bbox.height * scale, 0.5);
    const h = getRoomHeight(room.label);
    const wallT = 0.08; // wall thickness in model units

    const color = getRoomColor(room.label);

    // Build room geometry: floor + 4 walls (with slight inset to show wall thickness) + ceiling
    const verts: number[] = [];
    const norms: number[] = [];
    const idxList: number[] = [];
    let vi = 0;

    function addQuadLocal(
      v0: [number,number,number], v1: [number,number,number],
      v2: [number,number,number], v3: [number,number,number],
      n: [number,number,number]
    ) {
      verts.push(...v0, ...v1, ...v2, ...v3);
      norms.push(...n, ...n, ...n, ...n);
      idxList.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
      vi += 4;
    }

    const x0 = cx - w/2, x1 = cx + w/2;
    const z0 = cz - d/2, z1 = cz + d/2;
    const y0 = 0, y1 = h;

    // Floor
    addQuadLocal([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,1,0]);
    // Ceiling (slightly transparent-feeling via separate material color)
    addQuadLocal([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,-1,0]);
    // Front wall
    addQuadLocal([x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1]);
    // Back wall
    addQuadLocal([x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1],[0,0,1]);
    // Right wall
    addQuadLocal([x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[1,0,0]);
    // Left wall
    addQuadLocal([x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[-1,0,0]);

    const vertsF32 = new Float32Array(verts);
    const normsF32 = new Float32Array(norms);
    const idxsU16 = new Uint16Array(idxList);

    // Compute min/max for position accessor
    let minPx=Infinity,minPy=Infinity,minPz=Infinity,maxPx=-Infinity,maxPy=-Infinity,maxPz=-Infinity;
    for (let k=0;k<verts.length;k+=3){
      minPx=Math.min(minPx,verts[k]);minPy=Math.min(minPy,verts[k+1]);minPz=Math.min(minPz,verts[k+2]);
      maxPx=Math.max(maxPx,verts[k]);maxPy=Math.max(maxPy,verts[k+1]);maxPz=Math.max(maxPz,verts[k+2]);
    }

    const bvVerts = addBufferView(new Uint8Array(vertsF32.buffer), 34962);
    const bvNorms = addBufferView(new Uint8Array(normsF32.buffer), 34962);
    const bvIdx   = addBufferView(new Uint8Array(idxsU16.buffer), 34963);

    const posAcc = accessors.length;
    accessors.push({ bufferView: bvVerts, componentType: 5126, count: vertsF32.length/3, type: "VEC3", min:[minPx,minPy,minPz], max:[maxPx,maxPy,maxPz] });
    accessors.push({ bufferView: bvNorms, componentType: 5126, count: normsF32.length/3, type: "VEC3" });
    const idxAcc = accessors.length;
    accessors.push({ bufferView: bvIdx, componentType: 5123, count: idxsU16.length, type: "SCALAR" });

    // Floor material = room color (opaque), ceiling = slightly lighter
    const matIdx = materials.length;
    materials.push({
      name: `room_${room.label}_${i}`,
      pbrMetallicRoughness: {
        baseColorFactor: [color[0], color[1], color[2], 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.85,
      },
      doubleSided: true,
    });

    const meshIdx = meshes.length;
    meshes.push({
      name: room.name || room.label,
      primitives: [{ attributes: { POSITION: posAcc, NORMAL: posAcc+1 }, indices: idxAcc, material: matIdx }]
    });
    nodes.push(meshIdx);
  });

  // Combine all binary chunks into one buffer
  const totalBinarySize = bufferOffset;
  const combinedBuffer = new Uint8Array(totalBinarySize);
  let writeOffset = 0;
  for (const chunk of bufferChunks) {
    combinedBuffer.set(chunk, writeOffset);
    writeOffset += chunk.byteLength;
  }

  // Build scene nodes (one per mesh)
  const sceneNodes = nodes.map((meshIdx, i) => ({ name: `node_${i}`, mesh: meshIdx }));
  const nodeIndices = sceneNodes.map((_, i) => i);

  const gltfJson = {
    asset: { version: "2.0", generator: "CitadelTwin AI v2" },
    scene: 0,
    scenes: [{ name: "CitadelTwin Floor Plan", nodes: nodeIndices }],
    nodes: sceneNodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: totalBinarySize }],
  };

  const jsonStr = JSON.stringify(gltfJson);
  const jsonBuf = new TextEncoder().encode(jsonStr);
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
  const jsonPaddedLen = jsonBuf.length + jsonPad;

  const headerSize = 12;
  const chunkHeaderSize = 8;
  const totalSize = headerSize + chunkHeaderSize + jsonPaddedLen + chunkHeaderSize + totalBinarySize;

  const glb = new ArrayBuffer(totalSize);
  const view = new DataView(glb);
  const bytes = new Uint8Array(glb);

  let off = 0;
  view.setUint32(off, 0x46546C67, true); off += 4;
  view.setUint32(off, 2, true); off += 4;
  view.setUint32(off, totalSize, true); off += 4;

  view.setUint32(off, jsonPaddedLen, true); off += 4;
  view.setUint32(off, 0x4E4F534A, true); off += 4;
  bytes.set(jsonBuf, off); off += jsonBuf.length;
  for (let i = 0; i < jsonPad; i++) bytes[off++] = 0x20;

  view.setUint32(off, totalBinarySize, true); off += 4;
  view.setUint32(off, 0x004E4942, true); off += 4;
  bytes.set(combinedBuffer, off);

  return new Uint8Array(glb);
}

// ==================== HTML Visualization (High Contrast) ====================

function generateHTMLVisualization(elements: any): string {
  const rooms = elements.rooms || [];
  const doors = elements.doors || [];
  const windows = elements.windows || [];

  if (rooms.length === 0) {
    return `<div style="padding:40px;text-align:center;color:#666;">No rooms detected in this floor plan.</div>`;
  }

  // Find image bounds from all room bboxes
  let maxRight = 0, maxBottom = 0;
  rooms.forEach((r: any) => {
    maxRight = Math.max(maxRight, r.bbox.x + r.bbox.width);
    maxBottom = Math.max(maxBottom, r.bbox.y + r.bbox.height);
  });

  // Scale so the plan fits ~700px wide
  const TARGET_W = 680;
  const scaleFactor = Math.min(TARGET_W / (maxRight || 1), 600 / (maxBottom || 1));

  const colors: Record<string, { bg: string; border: string; text: string }> = {
    bedroom:        { bg: '#78B6E8CC', border: '#4582D1', text: '#1a2a3a' },
    master_bedroom: { bg: '#4582D1CC', border: '#2355A0', text: '#ffffff' },
    bathroom:       { bg: '#38C0CCCC', border: '#1A8A95', text: '#0a2a2d' },
    kitchen:        { bg: '#F2C42ECC', border: '#C49A0A', text: '#2a1a00' },
    living_room:    { bg: '#59BF82CC', border: '#2E8F53', text: '#0a2015' },
    dining_room:    { bg: '#E87F37CC', border: '#B55310', text: '#2a1000' },
    office:         { bg: '#9470DBCC', border: '#6040B0', text: '#ffffff' },
    garage:         { bg: '#9999A0CC', border: '#666670', text: '#1a1a20' },
    hallway:        { bg: '#D1D1CCCC', border: '#999990', text: '#1a1a18' },
    foyer:          { bg: '#E6C78ECC', border: '#B09050', text: '#2a1a00' },
    pantry:         { bg: '#CCAA59CC', border: '#997730', text: '#1a1000' },
    closet:         { bg: '#D9C7EBCC', border: '#9970C0', text: '#1a0a2a' },
    laundry:        { bg: '#73D9E6CC', border: '#30A8B8', text: '#0a2025' },
    porch:          { bg: '#8CD173CC', border: '#509040', text: '#0a1a08' },
    storage:        { bg: '#B3AFA5CC', border: '#807870', text: '#1a1815' },
    utility:        { bg: '#B8945BCC', border: '#806030', text: '#1a1000' },
  };
  const defaultColor = { bg: '#B0B0B0CC', border: '#808080', text: '#1a1a1a' };

  const roomDivs = rooms.map((room: any) => {
    const key = (room.label || '').toLowerCase().replace(/\s+/g, '_');
    const c = colors[key] || defaultColor;
    const lx = Math.round(room.bbox.x * scaleFactor);
    const ly = Math.round(room.bbox.y * scaleFactor);
    const lw = Math.max(Math.round(room.bbox.width * scaleFactor), 30);
    const lh = Math.max(Math.round(room.bbox.height * scaleFactor), 20);
    const shortName = (room.name || room.label).replace(/_/g, ' ');
    const dims = `${room.width_m}×${room.depth_m}m`;
    const area = `${room.area_m2}m²`;
    const fontSize = lw < 70 ? '8px' : lw < 100 ? '9px' : '10px';
    return `<div style="
      position:absolute;
      left:${lx}px;top:${ly}px;width:${lw}px;height:${lh}px;
      background:${c.bg};
      border:2px solid ${c.border};
      border-radius:3px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      text-align:center;overflow:hidden;
      box-shadow:0 1px 4px rgba(0,0,0,0.25);
      cursor:default;
    " title="${room.name}: ${room.width_m}m × ${room.depth_m}m (${room.area_m2}m²)">
      <div style="font-size:${fontSize};font-weight:700;color:${c.text};line-height:1.2;padding:2px;">${shortName}</div>
      <div style="font-size:8px;color:${c.text};opacity:0.85;">${dims}</div>
      <div style="font-size:8px;color:${c.text};opacity:0.7;">${area}</div>
    </div>`;
  }).join('');

  // Door markers
  const doorDivs = doors.map((d: any) => {
    const lx = Math.round(d.bbox.x * scaleFactor);
    const ly = Math.round(d.bbox.y * scaleFactor);
    const lw = Math.max(Math.round(d.bbox.width * scaleFactor), 8);
    const lh = Math.max(Math.round(d.bbox.height * scaleFactor), 8);
    return `<div style="position:absolute;left:${lx}px;top:${ly}px;width:${lw}px;height:${lh}px;background:#8B4513;border-radius:2px;opacity:0.85;" title="${d.label}"></div>`;
  }).join('');

  // Window markers
  const windowDivs = windows.map((w: any) => {
    const lx = Math.round(w.bbox.x * scaleFactor);
    const ly = Math.round(w.bbox.y * scaleFactor);
    const lw = Math.max(Math.round(w.bbox.width * scaleFactor), 8);
    const lh = Math.max(Math.round(w.bbox.height * scaleFactor), 4);
    return `<div style="position:absolute;left:${lx}px;top:${ly}px;width:${lw}px;height:${lh}px;background:#87CEEB;border:1px solid #4488AA;opacity:0.9;" title="${w.label}"></div>`;
  }).join('');

  const legendItems = Object.entries(colors)
    .filter(([type]) => rooms.some((r: any) => r.label?.toLowerCase().replace(/\s+/g, '_') === type))
    .map(([type, c]) => `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;">
      <div style="width:14px;height:14px;background:${c.bg};border:1px solid ${c.border};border-radius:2px;flex-shrink:0;"></div>
      <span>${type.replace(/_/g, ' ')}</span>
    </div>`).join('');

  return `<div style="font-family:system-ui,sans-serif;background:#1a1a2e;padding:20px;border-radius:8px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;font-size:16px;font-weight:700;color:#e2e8f0;">
        🏠 Floor Plan — ${rooms.length} rooms detected
        ${elements.building_info?.total_area_sqft ? `<span style="font-size:12px;font-weight:400;color:#94a3b8;margin-left:8px;">${elements.building_info.total_area_sqft} sq ft</span>` : ''}
      </h3>
      <div style="display:flex;gap:12px;font-size:11px;color:#94a3b8;">
        ${doors.length > 0 ? `<span>🚪 ${doors.length} doors</span>` : ''}
        ${windows.length > 0 ? `<span>🪟 ${windows.length} windows</span>` : ''}
      </div>
    </div>

    <div style="position:relative;display:inline-block;background:#0f172a;border:1px solid #334155;border-radius:4px;overflow:hidden;min-width:${Math.round(maxRight * scaleFactor) + 20}px;min-height:${Math.round(maxBottom * scaleFactor) + 20}px;">
      <div style="position:relative;margin:10px;">
        ${roomDivs}
        ${doorDivs}
        ${windowDivs}
        <div style="position:absolute;inset:0;pointer-events:none;"></div>
      </div>
    </div>

    <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px 16px;">
      ${legendItems}
      ${doors.length > 0 ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;"><div style="width:14px;height:14px;background:#8B4513;border-radius:2px;flex-shrink:0;"></div><span>door</span></div>` : ''}
      ${windows.length > 0 ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;"><div style="width:14px;height:14px;background:#87CEEB;border:1px solid #4488AA;flex-shrink:0;"></div><span>window</span></div>` : ''}
    </div>
  </div>`;
}
