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

    // ==================== HARD VALIDATION GATE (FIRST STEP) ====================
    // Use Gemini Vision to scan for numerical dimension strings BEFORE any processing
    console.log("Running pre-flight dimension scan via Gemini Vision...");

    const preFlightResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a dimension detection specialist. Your ONLY job is to determine if this architectural plan contains ANY numerical dimension annotations. Look for:
- Feet/inch marks: e.g. 10', 12'-0", 14'-6", 8'6"
- Metric dimensions: e.g. 3.5m, 3500mm, 4400, 7000
- Combined dimension strings: e.g. 12'x15', 4.4m x 3.7m
- Scale ratios: e.g. 1:100, 1/4" = 1'-0", 1" = 20'
- Any text containing ', ", m, mm, ft, feet, inches, meters symbols adjacent to numbers

You must be STRICT. Decorative numbers, room numbers, or page numbers do NOT count. Only actual measurement annotations count.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Scan this floor plan image. Does it contain ANY numerical dimension annotations (feet, inches, meters, millimeters)? Return your findings."
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
              name: "report_dimension_scan",
              description: "Report whether numerical dimensions were found on the plan",
              parameters: {
                type: "object",
                properties: {
                  has_numerical_dimensions: { type: "boolean", description: "true ONLY if actual measurement annotations (with unit symbols like ', \", m, mm, ft) are found. false if no dimension text exists." },
                  dimension_examples: { type: "array", items: { type: "string" }, description: "Up to 5 examples of dimension strings found, e.g. [\"14'-6\\\"\", \"3.5m\", \"1:100\"]. Empty array if none." },
                  has_scale: { type: "boolean", description: "true if a scale ratio or scale bar is detected" },
                  scan_notes: { type: "string", description: "Brief note about what was or wasn't found" }
                },
                required: ["has_numerical_dimensions", "dimension_examples", "has_scale", "scan_notes"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "report_dimension_scan" } },
      }),
    });

    if (!preFlightResponse.ok) {
      const errText = await preFlightResponse.text();
      console.error("Pre-flight scan failed:", preFlightResponse.status, errText);
      throw new Error(`Pre-flight dimension scan failed: ${preFlightResponse.status}`);
    }

    const preFlightData = await preFlightResponse.json();
    const preFlightToolCall = preFlightData.choices?.[0]?.message?.tool_calls?.[0];
    if (!preFlightToolCall) throw new Error("Pre-flight scan did not return structured data");

    const scanResult = JSON.parse(preFlightToolCall.function.arguments);
    console.log(`Pre-flight scan result: has_dimensions=${scanResult.has_numerical_dimensions}, has_scale=${scanResult.has_scale}, examples=${JSON.stringify(scanResult.dimension_examples)}, notes=${scanResult.scan_notes}`);

    // HARD STOP: If NO numerical dimensions found → reject immediately
    if (!scanResult.has_numerical_dimensions) {
      console.warn('HARD VALIDATION GATE TRIGGERED: No numerical dimensions detected. Stopping pipeline.');
      return new Response(
        JSON.stringify({
          status: "validation_failed",
          error: "Structural data missing. Please upload a plan with numerical dimensions. Automatic estimation is disabled to ensure 100% engineering accuracy.",
          validation: {
            dimensions_found: false,
            scale_found: scanResult.has_scale || false,
            reason: "no_measurements_no_scale",
            scan_notes: scanResult.scan_notes || "",
          },
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Pre-flight PASSED. Dimensions confirmed: ${scanResult.dimension_examples.join(', ')}. Proceeding to full analysis...`);
    // ==================== END HARD VALIDATION GATE ====================

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
            content: `You are an expert architectural floor plan analyzer with civil engineering precision. Analyze the provided floor plan image following these CRITICAL rules:

## 1. HONESTY ABOUT DIMENSIONS — MOST IMPORTANT RULE
- **CRITICAL**: You MUST NOT fabricate, estimate, or invent room dimensions.
- ONLY return width_m, depth_m, area_m2, width_ft, depth_ft values if there are ACTUAL dimension annotations written on the plan (e.g., "14'-6"", "3.5m", "7000", "12'x15'").
- If a room has NO written dimension text on the plan, you MUST return width_m: 0, depth_m: 0, area_m2: 0, width_ft: 0, depth_ft: 0, and original_dimension_text: "".
- Set dimensions_available to true ONLY if the plan contains at least one written dimension annotation. Otherwise set it to false.
- Overall dimension annotations on the building exterior (like "7000" or "11725" in mm) count as dimensions_available: true, but only assign them to the building_info, NOT to individual rooms unless the room itself has its own annotation.

## 2. SCALE DETECTION (Priority Order)
- FIRST: Search for written scale text (e.g., "1" = 10'", "1:100", "Scale: 1/4" = 1'-0"").
- SECOND: Look for a graphic scale bar and use it to calibrate pixel-to-unit ratio.
- THIRD: If no scale or dimensions are found, mark scale_source as "none".
- Return the detected scale_source ("text", "bar", "estimated", "none") and the unit system.

## 3. DIMENSION TEXT IS SOURCE OF TRUTH
- Read ALL dimension strings written on the plan (e.g., "14'-6"", "3.5m", "12'x15'").
- If a dimension text says a room is 14'-6" × 12'-0", those EXACT numbers must be returned.
- If visual pixel geometry conflicts with written dimension text, the WRITTEN TEXT MUST OVERRIDE.
- If NO dimension text exists on the plan, DO NOT estimate or guess dimensions.

## 4. WALL CLASSIFICATION
- Detect wall line thickness in the drawing.
- Outer/Load-Bearing Walls: thickness > 0.2m (8 inches) — typically drawn with thicker/double lines.
- Inner/Partition Walls: thickness < 0.15m (6 inches) — typically drawn with thinner single lines.
- Return wall_type as "exterior_wall", "interior_wall", or "load_bearing_wall" with thickness_m.

## 5. UNIT DETECTION
- Detect whether the plan uses Imperial (feet/inches, e.g., 14'-6") or Metric (meters, e.g., 4.4m).
- If no dimensions exist, return unit_system as "unknown".

## 6. ROOM DETECTION
- Detect ALL rooms with precise bounding boxes (x, y, width, height in pixels from top-left).
- Include the original_dimension_text field with the EXACT text written on the plan for that room. If none, use empty string.
- Detect doors (swing arcs), windows, and all architectural elements.

## 7. BUILDING CONTEXT
- Identify total building footprint, orientation, number of floors.
- Note the building type (residential, commercial, etc.).
- Only calculate total_area_sqft if actual dimensions are available.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this floor plan with maximum precision.
1. IMPORTANT: Only report dimensions that are ACTUALLY WRITTEN on the plan. Do NOT estimate or fabricate any room dimensions.
2. If no dimension text exists anywhere on the plan, set dimensions_available to false.
3. Classify every wall as exterior (thick/double-line) or interior (thin/single-line).
4. Detect the scale and unit system if dimensions exist, otherwise set scale_source to "none" and unit_system to "unknown".
5. Return precise bounding boxes for each room. Only include dimension values if the room has actual written measurements.`
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
              description: "Return all detected rooms, walls, doors, and windows from the floor plan with precise measurements",
              parameters: {
                type: "object",
                properties: {
                  dimensions_available: { type: "boolean", description: "true ONLY if the plan has actual written dimension annotations (e.g., 14'-6\", 3.5m, 7000mm). false if no measurements are written anywhere on the plan." },
                  image_width_px: { type: "number", description: "Total image width in pixels" },
                  image_height_px: { type: "number", description: "Total image height in pixels" },
                  scale_info: {
                    type: "object",
                    description: "Detected scale information",
                    properties: {
                      scale_text: { type: "string", description: "Original scale text found on plan, e.g. '1/4\" = 1'-0\"' or '1:100'. Empty if none found." },
                      scale_source: { type: "string", enum: ["text", "bar", "estimated", "none"], description: "How the scale was determined. 'none' if no scale or dimensions found." },
                      pixels_per_meter: { type: "number", description: "Calculated pixels per meter. 0 if unknown." },
                      unit_system: { type: "string", enum: ["imperial", "metric", "unknown"], description: "Detected unit system. 'unknown' if no dimensions on plan." }
                    },
                    required: ["scale_source", "pixels_per_meter", "unit_system"]
                  },
                  rooms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Room type: bedroom, master_bedroom, bathroom, kitchen, living_room, dining_room, office, garage, hallway, foyer, pantry, closet, walk_in_closet, laundry, porch, storage, utility, den, mudroom, powder_room, balcony, mechanical" },
                        name: { type: "string", description: "Room name exactly as shown on plan" },
                        confidence: { type: "number", description: "Detection confidence 0-1" },
                        bbox: {
                          type: "object",
                          properties: {
                            x: { type: "number" }, y: { type: "number" },
                            width: { type: "number" }, height: { type: "number" }
                          },
                          required: ["x", "y", "width", "height"]
                        },
                        original_dimension_text: { type: "string", description: "The EXACT dimension text written on the plan for this room, e.g. \"14'-6\\\" x 12'-0\\\"\" or \"4.4m x 3.7m\". Empty string if no dimensions written." },
                        width_m: { type: "number", description: "Real-world width in meters (converted from plan dimensions)" },
                        depth_m: { type: "number", description: "Real-world depth in meters (converted from plan dimensions)" },
                        area_m2: { type: "number", description: "Area in square meters (width_m × depth_m)" },
                        width_ft: { type: "number", description: "Width in feet (for imperial plans)" },
                        depth_ft: { type: "number", description: "Depth in feet (for imperial plans)" }
                      },
                      required: ["label", "name", "confidence", "bbox", "width_m", "depth_m", "area_m2"]
                    }
                  },
                  walls: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        wall_type: { type: "string", enum: ["exterior_wall", "interior_wall", "load_bearing_wall"], description: "Wall classification based on thickness" },
                        confidence: { type: "number" },
                        bbox: {
                          type: "object",
                          properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } },
                          required: ["x", "y", "width", "height"]
                        },
                        thickness_m: { type: "number", description: "Wall thickness in meters. Exterior: >0.2m, Interior: <0.15m" },
                        length_m: { type: "number", description: "Wall length in meters" }
                      },
                      required: ["wall_type", "confidence", "bbox", "thickness_m"]
                    }
                  },
                  doors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        door_type: { type: "string", enum: ["single", "double", "sliding", "pocket", "french", "garage"], description: "Type of door" },
                        width_m: { type: "number", description: "Door width in meters" },
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
                        width_m: { type: "number", description: "Window width in meters" },
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
                      total_area_m2: { type: "number" },
                      building_type: { type: "string" },
                      num_floors: { type: "number" },
                      exterior_wall_thickness_m: { type: "number", description: "Average exterior wall thickness" },
                      interior_wall_thickness_m: { type: "number", description: "Average interior wall thickness" },
                      num_exterior_walls: { type: "number" },
                      num_interior_walls: { type: "number" },
                      num_doors: { type: "number" },
                      num_windows: { type: "number" }
                    }
                  }
                },
                required: ["dimensions_available", "rooms", "walls", "doors", "windows", "scale_info"]
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
    console.log(`Scale: ${detectedElements.scale_info?.scale_source || 'unknown'}, Units: ${detectedElements.scale_info?.unit_system || 'unknown'}`);
    console.log(`Dimensions available: ${detectedElements.dimensions_available}`);

    // Post-analysis: determine visual draft status based on individual room dimensions
    const hasNumericalMeasurements = (detectedElements.rooms || []).some(
      (r: any) => r.original_dimension_text && r.original_dimension_text.trim() !== ''
    );
    const isVisualDraftOnly = !hasNumericalMeasurements;
    if (isVisualDraftOnly) {
      console.log(`No individual room dimension text found. Proceeding as Visual Draft.`);
    }

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

    // Generate GLB with per-room color materials and wall classification
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
        model_description: `AI-generated 3D model. ${roomCount} rooms detected with color-coded materials. Scale: ${detectedElements.scale_info?.scale_source || 'estimated'}. Units: ${detectedElements.scale_info?.unit_system || 'metric'}.`,
        model_file_path: fileName,
        generation_status: 'completed',
        file_size: glbData.length,
        generation_prompt: `AI floor plan analysis: ${roomCount} rooms, scale: ${detectedElements.scale_info?.scale_text || 'auto'}`,
        processing_time_ms: Date.now() - timestamp,
      })
      .select('id').single();

    const dimensionsAvailable = detectedElements.dimensions_available === true;

    // Sanitize building_info — remove area values if no dimensions on plan
    if (!dimensionsAvailable && detectedElements.building_info) {
      detectedElements.building_info.total_area_sqft = 0;
      detectedElements.building_info.total_area_m2 = 0;
    }

    // Build detections — only include dimensions if they actually exist on the plan
    const detections = (detectedElements.rooms || []).map((room: any) => {
      const hasDims = dimensionsAvailable && room.original_dimension_text && room.original_dimension_text.trim() !== '';
      return {
        class: `space_${room.label}`,
        name: room.name,
        confidence: room.confidence,
        width_m: hasDims ? room.width_m?.toFixed(2) : null,
        depth_m: hasDims ? room.depth_m?.toFixed(2) : null,
        area_m2: hasDims ? room.area_m2?.toFixed(2) : null,
        width_ft: hasDims ? room.width_ft?.toFixed(1) : null,
        depth_ft: hasDims ? room.depth_ft?.toFixed(1) : null,
        original_dimension_text: hasDims ? room.original_dimension_text : '',
        bbox: room.bbox,
        label: room.label,
      };
    });

    // Build wall detections
    const wallDetections = (detectedElements.walls || []).map((wall: any) => ({
      wall_type: wall.wall_type,
      thickness_m: wall.thickness_m,
      length_m: wall.length_m,
      confidence: wall.confidence,
      bbox: wall.bbox,
    }));

    const htmlView = generateHTMLVisualization(detectedElements);

    return new Response(
      JSON.stringify({
        status: "success",
        glb_url: glbUrl,
        html_view: htmlView,
        detections,
        dimensions_available: dimensionsAvailable,
        visual_draft_only: isVisualDraftOnly,
        visual_draft_warning: isVisualDraftOnly
          ? 'Generated via Scale Bar only; internal room dimensions are estimated.'
          : null,
        walls: wallDetections,
        building_info: detectedElements.building_info || {},
        scale_info: detectedElements.scale_info || {},
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

const ROOM_COLORS: Record<string, [number, number, number]> = {
  bedroom:        [0.47, 0.71, 0.91],
  master_bedroom: [0.27, 0.51, 0.82],
  bathroom:       [0.22, 0.75, 0.80],
  kitchen:        [0.95, 0.77, 0.18],
  living_room:    [0.35, 0.75, 0.51],
  dining_room:    [0.91, 0.50, 0.22],
  office:         [0.58, 0.44, 0.86],
  garage:         [0.60, 0.60, 0.62],
  hallway:        [0.82, 0.82, 0.80],
  foyer:          [0.90, 0.78, 0.56],
  pantry:         [0.80, 0.65, 0.35],
  closet:         [0.85, 0.78, 0.92],
  walk_in_closet: [0.77, 0.66, 0.88],
  laundry:        [0.45, 0.85, 0.90],
  porch:          [0.55, 0.82, 0.45],
  balcony:        [0.55, 0.82, 0.45],
  storage:        [0.70, 0.68, 0.65],
  utility:        [0.72, 0.58, 0.42],
  mechanical:     [0.72, 0.58, 0.42],
  den:            [0.77, 0.60, 0.42],
  mudroom:        [0.63, 0.53, 0.42],
  powder_room:    [0.53, 0.80, 0.87],
};

const ROOM_COLORS_HEX: Record<string, string> = {
  bedroom: '#78B6E8', master_bedroom: '#4582D1', bathroom: '#38C0CC',
  kitchen: '#F2C42E', living_room: '#59BF82', dining_room: '#E87F37',
  office: '#9470DB', garage: '#9999A0', hallway: '#D1D1CC',
  foyer: '#E6C78E', pantry: '#CCAA59', closet: '#D9C7EB',
  walk_in_closet: '#C4A8E0', laundry: '#73D9E6', porch: '#8CD173',
  balcony: '#8CD173', storage: '#B3AFA5', utility: '#B8945B',
  mechanical: '#B8945B', den: '#C49A6C', mudroom: '#A0886B',
  powder_room: '#88CCDD',
};

// Wall type colors for GLB rendering
const WALL_COLORS: Record<string, [number, number, number]> = {
  exterior_wall:    [0.25, 0.25, 0.28],  // Dark structural grey
  load_bearing_wall:[0.30, 0.28, 0.25],  // Dark brown-grey
  interior_wall:    [0.85, 0.83, 0.80],  // Light partition white
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

// ==================== GLB Generation with Wall Classification ====================

function generateGLBFromDetections(elements: any, uploadId: string): Uint8Array {
  const rooms = elements.rooms || [];
  const walls = elements.walls || [];
  const scaleInfo = elements.scale_info || {};

  // Use real-world dimensions when available (snap-to-measurement)
  // The AI returns width_m/depth_m based on OCR text (source of truth)
  // We compute a scale factor from pixels to meters using room data
  let pixelsPerMeter = scaleInfo.pixels_per_meter || 50;

  // If we have rooms with both bbox and real dimensions, calibrate
  const calibrationRooms = rooms.filter((r: any) => r.bbox && r.width_m > 0 && r.depth_m > 0);
  if (calibrationRooms.length > 0) {
    const scaleFactors = calibrationRooms.map((r: any) => {
      const pxW = r.bbox.width;
      const pxH = r.bbox.height;
      const realW = r.width_m;
      const realH = r.depth_m;
      return ((pxW / realW) + (pxH / realH)) / 2;
    });
    pixelsPerMeter = scaleFactors.reduce((a: number, b: number) => a + b, 0) / scaleFactors.length;
  }

  // Model scale: convert real-world meters to 3D scene units (1 unit = 1 meter)
  const modelScale = 1.0;

  // Calculate center offset from real-world positions
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rooms.forEach((r: any) => {
    if (r.bbox) {
      const rX = r.bbox.x / pixelsPerMeter;
      const rY = r.bbox.y / pixelsPerMeter;
      const rW = r.width_m || (r.bbox.width / pixelsPerMeter);
      const rH = r.depth_m || (r.bbox.height / pixelsPerMeter);
      minX = Math.min(minX, rX);
      minY = Math.min(minY, rY);
      maxX = Math.max(maxX, rX + rW);
      maxY = Math.max(maxY, rY + rH);
    }
  });
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 20; maxY = 15; }
  const centerOffsetX = (minX + maxX) / 2;
  const centerOffsetY = (minY + maxY) / 2;

  const meshes: any[] = [];
  const materials: any[] = [];
  const accessors: any[] = [];
  const bufferViews: any[] = [];
  const nodes: number[] = [];
  const bufferChunks: Uint8Array[] = [];
  let bufferOffset = 0;

  function addBufferView(data: Uint8Array, target: number): number {
    const idx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: bufferOffset, byteLength: data.byteLength, target });
    bufferChunks.push(data);
    bufferOffset += data.byteLength;
    const pad = (4 - (data.byteLength % 4)) % 4;
    if (pad > 0) {
      bufferChunks.push(new Uint8Array(pad));
      bufferOffset += pad;
    }
    return idx;
  }

  // Foundation slab
  {
    const bw = (maxX - minX) * modelScale + 2;
    const bd = (maxY - minY) * modelScale + 2;
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

  // Generate each room as separate mesh using REAL dimensions (snap-to-measurement)
  rooms.forEach((room: any, i: number) => {
    const bbox = room.bbox;
    // Use real-world dimensions as source of truth
    const w = (room.width_m || (bbox.width / pixelsPerMeter)) * modelScale;
    const d = (room.depth_m || (bbox.height / pixelsPerMeter)) * modelScale;
    const h = getRoomHeight(room.label);

    // Position based on bbox center, converted to real-world coords
    const cx = ((bbox.x + bbox.width / 2) / pixelsPerMeter - centerOffsetX) * modelScale;
    const cz = ((bbox.y + bbox.height / 2) / pixelsPerMeter - centerOffsetY) * modelScale;

    const color = getRoomColor(room.label);

    const verts: number[] = [];
    const norms: number[] = [];
    const idxList: number[] = [];
    let vertIdx = 0;

    function addQuadLocal(
      v0: [number,number,number], v1: [number,number,number],
      v2: [number,number,number], v3: [number,number,number],
      n: [number,number,number]
    ) {
      verts.push(...v0, ...v1, ...v2, ...v3);
      norms.push(...n, ...n, ...n, ...n);
      idxList.push(vertIdx, vertIdx+1, vertIdx+2, vertIdx, vertIdx+2, vertIdx+3);
      vertIdx += 4;
    }

    const x0 = cx - w/2, x1 = cx + w/2;
    const z0 = cz - d/2, z1 = cz + d/2;
    const y0 = 0, y1 = h;

    // Floor
    addQuadLocal([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,1,0]);
    // Ceiling
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

  // Generate wall meshes with distinct materials (exterior=dark, interior=light)
  walls.forEach((wall: any, i: number) => {
    if (!wall.bbox) return;
    const wallType = wall.wall_type || 'interior_wall';
    const thickness = wall.thickness_m || (wallType === 'exterior_wall' ? 0.25 : 0.12);
    const wallColor = WALL_COLORS[wallType] || WALL_COLORS.interior_wall;
    const wallHeight = wallType === 'exterior_wall' ? 3.0 : 2.7;

    const wX = (wall.bbox.x / pixelsPerMeter - centerOffsetX) * modelScale;
    const wZ = (wall.bbox.y / pixelsPerMeter - centerOffsetY) * modelScale;
    const wW = (wall.bbox.width / pixelsPerMeter) * modelScale;
    const wD = (wall.bbox.height / pixelsPerMeter) * modelScale;

    // Determine if wall is horizontal or vertical
    const isHorizontal = wW > wD;
    const wallLen = isHorizontal ? wW : wD;
    const wallThick = thickness * modelScale;

    const cx = wX + wW / 2;
    const cz = wZ + wD / 2;

    const x0 = isHorizontal ? cx - wallLen/2 : cx - wallThick/2;
    const x1 = isHorizontal ? cx + wallLen/2 : cx + wallThick/2;
    const z0 = isHorizontal ? cz - wallThick/2 : cz - wallLen/2;
    const z1 = isHorizontal ? cz + wallThick/2 : cz + wallLen/2;
    const y0 = 0, y1 = wallHeight;

    const verts: number[] = [];
    const norms: number[] = [];
    const idxList: number[] = [];
    let vertIdx = 0;

    function addQuad(
      v0: [number,number,number], v1: [number,number,number],
      v2: [number,number,number], v3: [number,number,number],
      n: [number,number,number]
    ) {
      verts.push(...v0, ...v1, ...v2, ...v3);
      norms.push(...n, ...n, ...n, ...n);
      idxList.push(vertIdx, vertIdx+1, vertIdx+2, vertIdx, vertIdx+2, vertIdx+3);
      vertIdx += 4;
    }

    addQuad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,1,0]);
    addQuad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,-1,0]);
    addQuad([x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1]);
    addQuad([x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1],[0,0,1]);
    addQuad([x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[1,0,0]);
    addQuad([x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[-1,0,0]);

    const vertsF32 = new Float32Array(verts);
    const normsF32 = new Float32Array(norms);
    const idxsU16 = new Uint16Array(idxList);

    let minPx=Infinity,minPy=Infinity,minPz=Infinity,maxPx=-Infinity,maxPy=-Infinity,maxPz=-Infinity;
    for (let k=0;k<verts.length;k+=3){
      minPx=Math.min(minPx,verts[k]);minPy=Math.min(minPy,verts[k+1]);minPz=Math.min(minPz,verts[k+2]);
      maxPx=Math.max(maxPx,verts[k]);maxPy=Math.max(maxPy,verts[k+1]);maxPz=Math.max(maxPz,verts[k+2]);
    }

    const bvV = addBufferView(new Uint8Array(vertsF32.buffer), 34962);
    const bvN = addBufferView(new Uint8Array(normsF32.buffer), 34962);
    const bvI = addBufferView(new Uint8Array(idxsU16.buffer), 34963);

    const posAcc = accessors.length;
    accessors.push({ bufferView: bvV, componentType: 5126, count: vertsF32.length/3, type: "VEC3", min:[minPx,minPy,minPz], max:[maxPx,maxPy,maxPz] });
    accessors.push({ bufferView: bvN, componentType: 5126, count: normsF32.length/3, type: "VEC3" });
    const idxAcc = accessors.length;
    accessors.push({ bufferView: bvI, componentType: 5123, count: idxsU16.length, type: "SCALAR" });

    const matIdx = materials.length;
    materials.push({
      name: `wall_${wallType}_${i}`,
      pbrMetallicRoughness: {
        baseColorFactor: [wallColor[0], wallColor[1], wallColor[2], 1.0],
        metallicFactor: wallType === 'exterior_wall' ? 0.15 : 0.0,
        roughnessFactor: wallType === 'exterior_wall' ? 0.6 : 0.9,
      },
      doubleSided: true,
    });

    const meshIdx = meshes.length;
    meshes.push({
      name: `${wallType}_${i}`,
      primitives: [{ attributes: { POSITION: posAcc, NORMAL: posAcc+1 }, indices: idxAcc, material: matIdx }]
    });
    nodes.push(meshIdx);
  });

  // Combine all binary chunks
  const totalBinarySize = bufferOffset;
  const combinedBuffer = new Uint8Array(totalBinarySize);
  let writeOffset = 0;
  for (const chunk of bufferChunks) {
    combinedBuffer.set(chunk, writeOffset);
    writeOffset += chunk.byteLength;
  }

  const sceneNodes = nodes.map((meshIdx, i) => ({ name: `node_${i}`, mesh: meshIdx }));
  const nodeIndices = sceneNodes.map((_, i) => i);

  const gltfJson = {
    asset: { version: "2.0", generator: "CitadelTwin AI v3" },
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

// ==================== HTML Visualization ====================

function generateHTMLVisualization(elements: any): string {
  const rooms = elements.rooms || [];
  const doors = elements.doors || [];
  const windows = elements.windows || [];
  const walls = elements.walls || [];
  const scaleInfo = elements.scale_info || {};

  if (rooms.length === 0) {
    return `<div style="padding:40px;text-align:center;color:#666;">No rooms detected in this floor plan.</div>`;
  }

  let maxRight = 0, maxBottom = 0;
  rooms.forEach((r: any) => {
    maxRight = Math.max(maxRight, r.bbox.x + r.bbox.width);
    maxBottom = Math.max(maxBottom, r.bbox.y + r.bbox.height);
  });

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
    walk_in_closet: { bg: '#C4A8E0CC', border: '#8860B8', text: '#1a0a2a' },
    laundry:        { bg: '#73D9E6CC', border: '#30A8B8', text: '#0a2025' },
    porch:          { bg: '#8CD173CC', border: '#509040', text: '#0a1a08' },
    balcony:        { bg: '#8CD173CC', border: '#509040', text: '#0a1a08' },
    storage:        { bg: '#B3AFA5CC', border: '#807870', text: '#1a1815' },
    utility:        { bg: '#B8945BCC', border: '#806030', text: '#1a1000' },
    mechanical:     { bg: '#B8945BCC', border: '#806030', text: '#1a1000' },
    den:            { bg: '#C49A6CCC', border: '#906030', text: '#1a1000' },
    mudroom:        { bg: '#A0886BCC', border: '#706040', text: '#1a1000' },
    powder_room:    { bg: '#88CCDDCC', border: '#5090A0', text: '#0a2025' },
  };
  const defaultColor = { bg: '#B0B0B0CC', border: '#808080', text: '#1a1a1a' };

  const unitLabel = scaleInfo.unit_system === 'imperial' ? 'ft' : 'm';

  const roomDivs = rooms.map((room: any) => {
    const key = (room.label || '').toLowerCase().replace(/\s+/g, '_');
    const c = colors[key] || defaultColor;
    const lx = Math.round(room.bbox.x * scaleFactor);
    const ly = Math.round(room.bbox.y * scaleFactor);
    const lw = Math.max(Math.round(room.bbox.width * scaleFactor), 30);
    const lh = Math.max(Math.round(room.bbox.height * scaleFactor), 20);
    const shortName = (room.name || room.label).replace(/_/g, ' ');
    
    // Show original dimension text if available, else computed dims
    const dimText = room.original_dimension_text || `${room.width_m?.toFixed(1)}×${room.depth_m?.toFixed(1)}m`;
    const area = `${room.area_m2?.toFixed(1)}m²`;
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
    " title="${room.name}: ${dimText} (${area})">
      <div style="font-size:${fontSize};font-weight:700;color:${c.text};line-height:1.2;padding:2px;">${shortName}</div>
      <div style="font-size:8px;color:${c.text};opacity:0.85;">${dimText}</div>
      <div style="font-size:8px;color:${c.text};opacity:0.7;">${area}</div>
    </div>`;
  }).join('');

  const doorDivs = doors.map((d: any) => {
    const lx = Math.round(d.bbox.x * scaleFactor);
    const ly = Math.round(d.bbox.y * scaleFactor);
    const lw = Math.max(Math.round(d.bbox.width * scaleFactor), 8);
    const lh = Math.max(Math.round(d.bbox.height * scaleFactor), 8);
    return `<div style="position:absolute;left:${lx}px;top:${ly}px;width:${lw}px;height:${lh}px;background:#8B4513;border-radius:2px;opacity:0.85;" title="${d.label}${d.door_type ? ' (' + d.door_type + ')' : ''}"></div>`;
  }).join('');

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

  const extWalls = walls.filter((w: any) => w.wall_type === 'exterior_wall' || w.wall_type === 'load_bearing_wall').length;
  const intWalls = walls.filter((w: any) => w.wall_type === 'interior_wall').length;

  const scaleInfoHtml = scaleInfo.scale_text
    ? `<span style="font-size:11px;color:#94a3b8;margin-left:8px;">Scale: ${scaleInfo.scale_text} (${scaleInfo.unit_system || 'metric'})</span>`
    : scaleInfo.unit_system
    ? `<span style="font-size:11px;color:#94a3b8;margin-left:8px;">Units: ${scaleInfo.unit_system}</span>`
    : '';

  return `<div style="font-family:system-ui,sans-serif;background:#1a1a2e;padding:20px;border-radius:8px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;font-size:16px;font-weight:700;color:#e2e8f0;">
        🏠 Floor Plan — ${rooms.length} rooms detected
        ${elements.building_info?.total_area_sqft ? `<span style="font-size:12px;font-weight:400;color:#94a3b8;margin-left:8px;">${elements.building_info.total_area_sqft} sq ft</span>` : ''}
        ${scaleInfoHtml}
      </h3>
      <div style="display:flex;gap:12px;font-size:11px;color:#94a3b8;">
        ${doors.length > 0 ? `<span>🚪 ${doors.length} doors</span>` : ''}
        ${windows.length > 0 ? `<span>🪟 ${windows.length} windows</span>` : ''}
        ${extWalls > 0 ? `<span>🧱 ${extWalls} ext. walls</span>` : ''}
        ${intWalls > 0 ? `<span>📐 ${intWalls} int. walls</span>` : ''}
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
      ${extWalls > 0 ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;"><div style="width:14px;height:14px;background:#40404acc;border:1px solid #303035;border-radius:2px;flex-shrink:0;"></div><span>exterior wall</span></div>` : ''}
      ${intWalls > 0 ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;"><div style="width:14px;height:14px;background:#d9d4cccc;border:1px solid #999;border-radius:2px;flex-shrink:0;"></div><span>interior wall</span></div>` : ''}
    </div>
  </div>`;
}
