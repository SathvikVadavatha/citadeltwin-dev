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
    console.log("Blueprint 3D processing started — Geometric Reconstruction Protocol");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

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

    // ==================== STEP 1: HARD VALIDATION GATE (FIRST STEP) ====================
    // Pre-flight scan for numerical dimensions AND scale bar
    console.log("STEP 1: Pre-flight dimension & scale scan via Gemini Vision...");

    const preFlightResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `You are a dimension detection specialist for architectural blueprints. Your ONLY job is to determine if this plan contains ANY of the following:
1. Numerical dimension annotations with unit symbols: e.g. 10', 12'-0", 14'-6", 3.5m, 3500mm, 4400, 7000
2. Scale ratios: e.g. 1:100, 1/4" = 1'-0", 1" = 20'
3. Graphic scale bars with marked distances
4. Combined dimension strings: e.g. 12'x15', 4.4m x 3.7m

Be STRICT: decorative numbers, room numbers, page numbers do NOT count. Only actual measurement annotations count.` }]
          },
          contents: [{
            parts: [
              { text: "Scan this floor plan. Does it contain numerical dimension annotations or a scale bar? Report findings." },
              { inlineData: { mimeType, data: base64Image } }
            ]
          }],
          tools: [{
            functionDeclarations: [{
              name: "report_dimension_scan",
              description: "Report whether numerical dimensions were found on the plan",
              parameters: {
                type: "object",
                properties: {
                  has_numerical_dimensions: { type: "boolean", description: "true ONLY if actual measurement annotations (with unit symbols like ', \", m, mm, ft) are found." },
                  dimension_examples: { type: "array", items: { type: "string" }, description: "Up to 5 examples of dimension strings found. Empty if none." },
                  has_scale_bar: { type: "boolean", description: "true if a graphic scale bar is detected" },
                  has_scale_text: { type: "boolean", description: "true if a scale ratio text is detected (e.g. 1:100)" },
                  scan_notes: { type: "string", description: "Brief note about findings" }
                },
                required: ["has_numerical_dimensions", "dimension_examples", "has_scale_bar", "has_scale_text", "scan_notes"]
              }
            }]
          }],
          toolConfig: {
            functionCallingConfig: {
              mode: "ANY",
              allowedFunctionNames: ["report_dimension_scan"]
            }
          }
        }),
      }
    );

    if (!preFlightResponse.ok) {
      const errText = await preFlightResponse.text();
      console.error("Pre-flight scan failed:", preFlightResponse.status, errText);
      throw new Error(`Pre-flight dimension scan failed: ${preFlightResponse.status}`);
    }

    const preFlightData = await preFlightResponse.json();
    const preFlightFnCall = preFlightData.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
    if (!preFlightFnCall) throw new Error("Pre-flight scan did not return structured data");

    const scanResult = preFlightFnCall.args;
    const hasAnyDimensions = scanResult.has_numerical_dimensions;
    const hasAnyScale = scanResult.has_scale_bar || scanResult.has_scale_text;
    console.log(`Pre-flight: dims=${hasAnyDimensions}, scale_bar=${scanResult.has_scale_bar}, scale_text=${scanResult.has_scale_text}, examples=${JSON.stringify(scanResult.dimension_examples)}`);

    // ZERO-ERROR VALIDATION: If NO dimensions AND NO scale bar → hard stop (422)
    if (!hasAnyDimensions && !hasAnyScale) {
      console.warn('HARD VALIDATION GATE: No dimensions and no scale bar detected. STOPPING.');
      return new Response(
        JSON.stringify({
          status: "validation_failed",
          error: "Insufficient Architectural Data. Please provide a plan with clear measurements to ensure 3D accuracy.",
          validation: {
            dimensions_found: false,
            scale_found: false,
            reason: "no_measurements_no_scale",
            scan_notes: scanResult.scan_notes || "",
          },
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Pre-flight PASSED. Proceeding to Geometric Reconstruction...`);

    // ==================== STEP 2: FULL GEOMETRIC RECONSTRUCTION ANALYSIS ====================
    console.log("STEP 2: Geometric Reconstruction analysis via Gemini Vision...");

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `You are a Geometric Reconstruction engine for architectural floor plans. Analyze with these STRICT rules:

## RULE 1: GEOMETRIC TRUTH — OCR IS ABSOLUTE
- Use OCR to find EVERY numerical dimension string (e.g., "12' 6\" x 11' 6\"", "3.5m × 4.2m").
- If a room is labeled with dimensions, those EXACT numbers define the 3D mesh geometry, overriding any visual/pixel data.
- Maintain the exact unit footprint by snapping wall intersections to the labels provided in the plan.
- If a room has NO written dimension text, set width_m=0, depth_m=0, area_m2=0 — do NOT guess.
- Set dimensions_available=true ONLY if actual dimension annotations exist on the plan.

## RULE 2: STRUCTURAL DIFFERENTIATION (OUTER vs INNER WALLS)
- Outer Walls: Identify the THICKEST perimeter lines. These are solid, opaque structural elements.
  - Standard thickness: 8 inches (0.20m) unless labeled otherwise.
- Inner Partition Walls: Identify interior dividing lines separating individual rooms.
  - Standard thickness: 5 inches (0.12m) unless labeled otherwise.
- Return wall_type as "exterior_wall", "interior_wall", or "load_bearing_wall".

## RULE 3: COMPONENT PLACEMENT — DOORS & WINDOWS
- Detect door swing arc symbols. Return door center-point (bbox center) and width.
- Detect window glass lines. Return window center-point and width.
- Generate 3D openings at the EXACT center-points indicated in the 2D plan.
- Standard door width: 36 inches (0.9m) unless labeled otherwise.
- Standard window width: 36 inches (0.9m) unless labeled otherwise.
- Assign door_type: "single", "double", "sliding", "pocket", "french", "garage".

## RULE 4: SCALE CALIBRATION (LARGEST DIMENSION)
- Calibrate the pixel-to-meter ratio based on the LARGEST identified dimension string in the plan.
- Priority 1: Use the LARGEST room dimension string found by OCR as the calibration anchor.
- Priority 2: Use scale text ratio if found (e.g., "1:100").
- Priority 3: Use graphic scale bar if found.
- Priority 4: If NONE found, use a standard door width (36"/0.9m) as fallback.
- Return scale_source: "largest_dimension", "text", "bar", "door_calibration".
- Return largest_dimension_text: the exact text of the largest dimension used for calibration.

## RULE 5: ROOM MATERIAL CLASSIFICATION
- Based on room text labels, assign semantic material types:
  - Bathroom/WC/Toilet → "space_toilet"
  - Bedroom/Master/Guest → "space_bedroom"
  - Kitchen/Kitchenette → "space_kitchen"
  - Living Room/Lounge → "space_living_room"
  - Dining Room → "space_dining_room"
  - Office/Study → "space_office"
  - Garage → "space_garage"
  - Hallway/Corridor → "space_hallway"
  - Other → "space_generic"

## RULE 6: ENTRANCE-ANCHORED ORIGIN
- Identify the PRIMARY ENTRANCE (front door) of the building.
- This entrance is the absolute origin (0,0,0) for all geometry.
- Return entrance_x_px and entrance_y_px for the entrance center-point in pixels.
- All coordinates are relative to the entrance anchor to prevent coordinate drift.` }]
          },
          contents: [{
            parts: [
              { text: `Perform Geometric Reconstruction on this floor plan:
1. OCR every dimension string — these are absolute truth for mesh generation. Snap wall intersections to labeled dimensions.
2. Classify all walls: Outer/perimeter walls (thickest lines, ~8"/0.2m) vs Interior partition walls (thinner lines, ~5"/0.12m).
3. Detect every door swing symbol and window glass line with exact center-point positions.
4. Calibrate scale using the LARGEST dimension string found. Report which dimension was used.
5. Assign room material types based on text labels.
6. Identify the PRIMARY ENTRANCE (front door) — this is the origin anchor (0,0,0).
7. Return precise bounding boxes for all elements.` },
              { inlineData: { mimeType, data: base64Image } }
            ]
          }],
          tools: [{
            functionDeclarations: [{
              name: "reconstruct_floor_plan_geometry",
              description: "Geometric Reconstruction of all architectural elements with entrance-anchored origin",
              parameters: {
              type: "object",
              properties: {
                dimensions_available: { type: "boolean", description: "true ONLY if actual written dimension annotations exist on the plan." },
                image_width_px: { type: "number" },
                image_height_px: { type: "number" },
                scale_info: {
                  type: "object",
                  properties: {
                    scale_text: { type: "string", description: "Scale text found, e.g. '1:100'. Empty if none." },
                    scale_source: { type: "string", enum: ["largest_dimension", "text", "bar", "door_calibration", "none"], description: "How scale was determined. 'largest_dimension' if calibrated from the largest OCR dimension string." },
                    pixels_per_meter: { type: "number", description: "Computed pixels per meter." },
                    unit_system: { type: "string", enum: ["imperial", "metric", "unknown"] },
                    calibration_reference: { type: "string", description: "What was used to calibrate: 'largest_room_dimension', 'scale_text', 'scale_bar', 'door_width_36in', or 'none'" },
                    largest_dimension_text: { type: "string", description: "The exact text of the largest dimension string used for calibration. Empty if not applicable." }
                  },
                  required: ["scale_source", "pixels_per_meter", "unit_system"]
                },
                rooms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", description: "Room type: bedroom, master_bedroom, bathroom, kitchen, living_room, dining_room, office, garage, hallway, foyer, pantry, closet, walk_in_closet, laundry, porch, storage, utility, den, mudroom, powder_room, balcony, mechanical" },
                      name: { type: "string", description: "Room name as shown on plan" },
                      material_class: { type: "string", description: "BIM material: space_toilet, space_bedroom, space_kitchen, space_living_room, space_dining_room, space_office, space_garage, space_hallway, space_generic" },
                      confidence: { type: "number" },
                      bbox: {
                        type: "object",
                        properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } },
                        required: ["x", "y", "width", "height"]
                      },
                      original_dimension_text: { type: "string", description: "EXACT dimension text from plan for this room. Empty string if none." },
                      width_m: { type: "number", description: "Width in meters from OCR text. 0 if no text." },
                      depth_m: { type: "number", description: "Depth in meters from OCR text. 0 if no text." },
                      area_m2: { type: "number", description: "Area m². 0 if no dimensions." },
                      width_ft: { type: "number", description: "Width in feet. 0 if no text." },
                      depth_ft: { type: "number", description: "Depth in feet. 0 if no text." }
                    },
                    required: ["label", "name", "material_class", "confidence", "bbox", "width_m", "depth_m", "area_m2"]
                  }
                },
                walls: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      wall_type: { type: "string", enum: ["exterior_wall", "interior_wall", "load_bearing_wall"] },
                      confidence: { type: "number" },
                      bbox: {
                        type: "object",
                        properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } },
                        required: ["x", "y", "width", "height"]
                      },
                      thickness_m: { type: "number", description: "Wall thickness. Exterior default: 0.20m. Interior default: 0.12m." },
                      length_m: { type: "number", description: "Wall length in meters from OCR or scale." }
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
                      door_type: { type: "string", enum: ["single", "double", "sliding", "pocket", "french", "garage"] },
                      width_m: { type: "number", description: "Door width in meters. Default 0.9m if not labeled." },
                      height_m: { type: "number", description: "Door height. Default 2.1m." },
                      confidence: { type: "number" },
                      bbox: {
                        type: "object",
                        properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } },
                        required: ["x", "y", "width", "height"]
                      },
                      center_x_px: { type: "number", description: "Center X of door opening in pixels" },
                      center_y_px: { type: "number", description: "Center Y of door opening in pixels" }
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
                      width_m: { type: "number", description: "Window width in meters. Default 0.9m." },
                      height_m: { type: "number", description: "Window height. Default 1.2m." },
                      sill_height_m: { type: "number", description: "Sill height from floor. Default 0.9m." },
                      confidence: { type: "number" },
                      bbox: {
                        type: "object",
                        properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } },
                        required: ["x", "y", "width", "height"]
                      },
                      center_x_px: { type: "number", description: "Center X of window in pixels" },
                      center_y_px: { type: "number", description: "Center Y of window in pixels" }
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
                    exterior_wall_thickness_m: { type: "number", description: "Default 0.20m (8 inches)" },
                    interior_wall_thickness_m: { type: "number", description: "Default 0.12m (5 inches)" },
                    num_exterior_walls: { type: "number" },
                    num_interior_walls: { type: "number" },
                    num_doors: { type: "number" },
                    num_windows: { type: "number" }
                  }
                },
                entrance_info: {
                  type: "object",
                  properties: {
                    entrance_x_px: { type: "number", description: "X pixel coordinate of primary entrance center" },
                    entrance_y_px: { type: "number", description: "Y pixel coordinate of primary entrance center" },
                    entrance_label: { type: "string", description: "Label of the entrance door, e.g. 'Front Door'" },
                    entrance_door_index: { type: "number", description: "Index into doors array for the primary entrance" }
                  },
                  required: ["entrance_x_px", "entrance_y_px"]
                }
              },
              required: ["dimensions_available", "rooms", "walls", "doors", "windows", "scale_info", "entrance_info"]
            }
          }]
          }],
          toolConfig: {
            functionCallingConfig: {
              mode: "ANY",
              allowedFunctionNames: ["reconstruct_floor_plan_geometry"]
            }
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errText);
      if (aiResponse.status === 429) throw new Error("AI rate limited. Please try again in a moment.");
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const fnCall = aiData.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
    if (!fnCall) throw new Error("AI did not return structured room data");

    const detectedElements = fnCall.args;
    console.log(`Geometric Reconstruction: ${detectedElements.rooms?.length || 0} rooms, ${detectedElements.walls?.length || 0} walls, ${detectedElements.doors?.length || 0} doors, ${detectedElements.windows?.length || 0} windows`);
    console.log(`Scale: ${detectedElements.scale_info?.scale_source || 'unknown'}, px/m: ${detectedElements.scale_info?.pixels_per_meter || 0}, largest_dim: ${detectedElements.scale_info?.largest_dimension_text || 'N/A'}`);
    console.log(`Entrance anchor: (${detectedElements.entrance_info?.entrance_x_px || 'N/A'}, ${detectedElements.entrance_info?.entrance_y_px || 'N/A'}) — ${detectedElements.entrance_info?.entrance_label || 'auto-detected'}`);

    // ==================== STEP 3: ENFORCE ARCHITECTURAL DEFAULTS ====================
    // Enforce standard wall thicknesses
    (detectedElements.walls || []).forEach((wall: any) => {
      if (wall.wall_type === 'exterior_wall' || wall.wall_type === 'load_bearing_wall') {
        wall.thickness_m = wall.thickness_m || EXTERIOR_WALL_THICKNESS;
        if (wall.thickness_m < 0.15) wall.thickness_m = EXTERIOR_WALL_THICKNESS; // correct too-thin exterior walls
      } else {
        wall.thickness_m = wall.thickness_m || INTERIOR_WALL_THICKNESS;
        if (wall.thickness_m > 0.18) wall.thickness_m = INTERIOR_WALL_THICKNESS; // correct too-thick interior walls
      }
    });

    // Enforce default door/window dimensions
    (detectedElements.doors || []).forEach((door: any) => {
      door.width_m = door.width_m || STANDARD_DOOR_WIDTH;
      door.height_m = door.height_m || 2.1;
    });
    (detectedElements.windows || []).forEach((win: any) => {
      win.width_m = win.width_m || 0.9;
      win.height_m = win.height_m || 1.2;
      win.sill_height_m = win.sill_height_m || 0.9;
    });

    // Post-analysis: determine visual draft status
    const hasNumericalMeasurements = (detectedElements.rooms || []).some(
      (r: any) => r.original_dimension_text && r.original_dimension_text.trim() !== ''
    );
    const isVisualDraftOnly = !hasNumericalMeasurements;
    if (isVisualDraftOnly) {
      console.log(`No individual room dimension text found. Marking as Visual Draft.`);
    }

    const timestamp = Date.now();

    // ==================== STEP 4: PERSIST TO SUPABASE ====================
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

    // ==================== STEP 5: GENERATE BIM-LEVEL GLB ====================
    const finalUploadId = modelUploadId || crypto.randomUUID();
    const glbData = generateBIMGLB(detectedElements, finalUploadId);
    const fileName = `${finalUploadId}/${timestamp}.glb`;

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
        upload_id: finalUploadId,
        model_name: `${buildingType} - ${roomCount} Rooms (Geometric Reconstruction)`,
        model_description: `Geometric Reconstruction Protocol. ${roomCount} rooms, OCR-anchored dimensions. Scale: ${detectedElements.scale_info?.scale_source || 'calibrated'} (${detectedElements.scale_info?.largest_dimension_text || 'auto'}). Walls: ext=${EXTERIOR_WALL_THICKNESS}m, int=${INTERIOR_WALL_THICKNESS}m. Origin: entrance-anchored.`,
        model_file_path: fileName,
        generation_status: 'completed',
        file_size: glbData.length,
        generation_prompt: `Geometric Reconstruction: ${roomCount} rooms, ${detectedElements.walls?.length || 0} walls, ${detectedElements.doors?.length || 0} doors, ${detectedElements.windows?.length || 0} windows`,
        processing_time_ms: Date.now() - timestamp,
      })
      .select('id').single();

    const dimensionsAvailable = detectedElements.dimensions_available === true;

    // Sanitize building_info if no dimensions
    if (!dimensionsAvailable && detectedElements.building_info) {
      detectedElements.building_info.total_area_sqft = 0;
      detectedElements.building_info.total_area_m2 = 0;
    }

    // Build detection results with material classes
    const detections = (detectedElements.rooms || []).map((room: any) => {
      const hasDims = dimensionsAvailable && room.original_dimension_text && room.original_dimension_text.trim() !== '';
      return {
        class: room.material_class || `space_${room.label}`,
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
        material_class: room.material_class || `space_${room.label}`,
      };
    });

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
          ? 'Generated via Scale Bar / Door Calibration only; internal room dimensions are estimated.'
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

// ==================== Architectural Constants ====================

const EXTERIOR_WALL_THICKNESS = 0.20; // 8 inches
const INTERIOR_WALL_THICKNESS = 0.12; // 5 inches
const STANDARD_DOOR_WIDTH = 0.9;      // 36 inches
const STANDARD_DOOR_HEIGHT = 2.1;     // ~7 feet
const STANDARD_WINDOW_HEIGHT = 1.2;
const STANDARD_WINDOW_SILL = 0.9;

// ==================== Room Color & Material System ====================

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

// Material class colors for BIM semantic rendering
const MATERIAL_CLASS_COLORS: Record<string, [number, number, number]> = {
  space_toilet:      [0.22, 0.75, 0.80],  // Cyan-teal for wet rooms
  space_bedroom:     [0.47, 0.71, 0.91],  // Soft blue
  space_kitchen:     [0.95, 0.77, 0.18],  // Warm yellow
  space_living_room: [0.35, 0.75, 0.51],  // Green
  space_dining_room: [0.91, 0.50, 0.22],  // Orange
  space_office:      [0.58, 0.44, 0.86],  // Purple
  space_garage:      [0.60, 0.60, 0.62],  // Grey
  space_hallway:     [0.82, 0.82, 0.80],  // Light grey
  space_generic:     [0.75, 0.75, 0.75],  // Neutral
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

const WALL_COLORS: Record<string, [number, number, number]> = {
  exterior_wall:     [0.25, 0.25, 0.28],  // Dark structural
  load_bearing_wall: [0.30, 0.28, 0.25],  // Dark brown-grey
  interior_wall:     [0.85, 0.83, 0.80],  // Light partition
};

function getRoomColor(label: string, materialClass?: string): [number, number, number] {
  // Prefer material class color for BIM accuracy
  if (materialClass && MATERIAL_CLASS_COLORS[materialClass]) {
    return MATERIAL_CLASS_COLORS[materialClass];
  }
  const key = label.toLowerCase().replace(/\s+/g, '_');
  return ROOM_COLORS[key] || [0.75, 0.75, 0.75];
}

function getRoomHeight(label: string): number {
  const l = label.toLowerCase();
  if (l.includes('garage')) return 3.0;
  if (l.includes('bathroom') || l.includes('bath') || l.includes('toilet') || l.includes('powder')) return 2.4;
  if (l.includes('living') || l.includes('great') || l.includes('lounge')) return 3.2;
  if (l.includes('foyer') || l.includes('porch') || l.includes('entry')) return 3.0;
  if (l.includes('storage') || l.includes('closet') || l.includes('pantry')) return 2.2;
  return 2.7;
}

// ==================== Geometric Reconstruction GLB Generation ====================

function generateBIMGLB(elements: any, _uploadId: string): Uint8Array {
  const rooms = elements.rooms || [];
  const walls = elements.walls || [];
  const doors = elements.doors || [];
  const windows = elements.windows || [];
  const scaleInfo = elements.scale_info || {};
  const entranceInfo = elements.entrance_info || {};

  // Scale calibration: Use LARGEST dimension room for calibration (Geometric Truth)
  let pixelsPerMeter = scaleInfo.pixels_per_meter || 50;

  const calibrationRooms = rooms.filter((r: any) => r.bbox && r.width_m > 0 && r.depth_m > 0);
  if (calibrationRooms.length > 0) {
    // Find the room with the LARGEST area (most reliable calibration anchor)
    const largestRoom = calibrationRooms.reduce((best: any, r: any) => {
      const area = r.width_m * r.depth_m;
      const bestArea = best.width_m * best.depth_m;
      return area > bestArea ? r : best;
    });
    // Calibrate from the largest dimension room
    pixelsPerMeter = ((largestRoom.bbox.width / largestRoom.width_m) + (largestRoom.bbox.height / largestRoom.depth_m)) / 2;
    console.log(`Scale calibrated from largest room "${largestRoom.name}": ${pixelsPerMeter.toFixed(1)} px/m (${largestRoom.original_dimension_text || 'N/A'})`);
  }

  const modelScale = 1.0;

  // Entrance-Anchored Origin: use primary entrance as (0,0,0)
  // All coordinates are offset so the entrance door center maps to origin
  let anchorX: number, anchorY: number;
  // Compute building footprint bounds for foundation slab
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rooms.forEach((r: any) => {
    if (r.bbox) {
      const rX = r.bbox.x / pixelsPerMeter;
      const rY = r.bbox.y / pixelsPerMeter;
      const rW = r.width_m > 0 ? r.width_m : (r.bbox.width / pixelsPerMeter);
      const rH = r.depth_m > 0 ? r.depth_m : (r.bbox.height / pixelsPerMeter);
      minX = Math.min(minX, rX);
      minY = Math.min(minY, rY);
      maxX = Math.max(maxX, rX + rW);
      maxY = Math.max(maxY, rY + rH);
    }
  });
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 20; maxY = 15; }

  if (entranceInfo.entrance_x_px && entranceInfo.entrance_y_px) {
    anchorX = entranceInfo.entrance_x_px / pixelsPerMeter;
    anchorY = entranceInfo.entrance_y_px / pixelsPerMeter;
    console.log(`Origin anchored to entrance: (${anchorX.toFixed(2)}, ${anchorY.toFixed(2)})m — "${entranceInfo.entrance_label || 'Front Door'}"`);
  } else {
    anchorX = (minX + maxX) / 2;
    anchorY = (minY + maxY) / 2;
    console.log(`No entrance detected — fallback to footprint center: (${anchorX.toFixed(2)}, ${anchorY.toFixed(2)})m`);
  }
  const centerOffsetX = anchorX;
  const centerOffsetY = anchorY;

  const meshes: any[] = [];
  const materials: any[] = [];
  const accessors: any[] = [];
  const bufferViews: any[] = [];
  const nodeList: number[] = [];
  const bufferChunks: Uint8Array[] = [];
  let bufferOffset = 0;

  function addBufferView(data: Uint8Array, target: number): number {
    const idx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: bufferOffset, byteLength: data.byteLength, target });
    bufferChunks.push(data);
    bufferOffset += data.byteLength;
    const pad = (4 - (data.byteLength % 4)) % 4;
    if (pad > 0) { bufferChunks.push(new Uint8Array(pad)); bufferOffset += pad; }
    return idx;
  }

  function addBoxMesh(
    name: string,
    x0: number, y0: number, z0: number,
    x1: number, y1: number, z1: number,
    color: [number, number, number],
    metallic: number, roughness: number
  ) {
    const verts: number[] = [];
    const norms: number[] = [];
    const idxList: number[] = [];
    let vi = 0;

    function addQuad(
      v0: [number,number,number], v1: [number,number,number],
      v2: [number,number,number], v3: [number,number,number],
      n: [number,number,number]
    ) {
      verts.push(...v0, ...v1, ...v2, ...v3);
      norms.push(...n, ...n, ...n, ...n);
      idxList.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
      vi += 4;
    }

    // Bottom
    addQuad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,1,0]);
    // Top
    addQuad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,-1,0]);
    // Front (-Z)
    addQuad([x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1]);
    // Back (+Z)
    addQuad([x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1],[0,0,1]);
    // Right (+X)
    addQuad([x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[1,0,0]);
    // Left (-X)
    addQuad([x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[-1,0,0]);

    const vertsF32 = new Float32Array(verts);
    const normsF32 = new Float32Array(norms);
    const idxsU16 = new Uint16Array(idxList);

    let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
    for (let k=0;k<verts.length;k+=3){
      mnx=Math.min(mnx,verts[k]);mny=Math.min(mny,verts[k+1]);mnz=Math.min(mnz,verts[k+2]);
      mxx=Math.max(mxx,verts[k]);mxy=Math.max(mxy,verts[k+1]);mxz=Math.max(mxz,verts[k+2]);
    }

    const bvV = addBufferView(new Uint8Array(vertsF32.buffer), 34962);
    const bvN = addBufferView(new Uint8Array(normsF32.buffer), 34962);
    const bvI = addBufferView(new Uint8Array(idxsU16.buffer), 34963);

    const posAcc = accessors.length;
    accessors.push({ bufferView: bvV, componentType: 5126, count: vertsF32.length/3, type: "VEC3", min:[mnx,mny,mnz], max:[mxx,mxy,mxz] });
    accessors.push({ bufferView: bvN, componentType: 5126, count: normsF32.length/3, type: "VEC3" });
    const idxAcc = accessors.length;
    accessors.push({ bufferView: bvI, componentType: 5123, count: idxsU16.length, type: "SCALAR" });

    const matIdx = materials.length;
    materials.push({
      name: `mat_${name}`,
      pbrMetallicRoughness: { baseColorFactor: [color[0], color[1], color[2], 1.0], metallicFactor: metallic, roughnessFactor: roughness },
      doubleSided: true,
    });

    const meshIdx = meshes.length;
    meshes.push({ name, primitives: [{ attributes: { POSITION: posAcc, NORMAL: posAcc+1 }, indices: idxAcc, material: matIdx }] });
    nodeList.push(meshIdx);
  }

  // ===== Compute room rectangles in meters (OCR-snapped) =====
  interface RoomRect {
    x0: number; z0: number; x1: number; z1: number;
    w: number; d: number; h: number; label: string; name: string;
    color: [number, number, number]; materialClass: string;
  }

  // --- Room layout reconstruction (reliable dims; bbox x/y only for row grouping) ---
  const reconstructedPositions = new Map<number, { newX: number; newZ: number }>();
  let layoutTotalWidthM = 0;
  let layoutTotalHeightM = 0;

  let minRoomBboxY = Infinity;
  let maxRoomBboxBottom = -Infinity;
  rooms.forEach((r: any) => {
    if (r.bbox) {
      minRoomBboxY = Math.min(minRoomBboxY, r.bbox.y);
      maxRoomBboxBottom = Math.max(maxRoomBboxBottom, r.bbox.y + r.bbox.height);
    }
  });
  const totalBuildingHeightForRows = maxRoomBboxBottom - minRoomBboxY;
  const rowYThreshold =
    isFinite(totalBuildingHeightForRows) && totalBuildingHeightForRows > 0
      ? totalBuildingHeightForRows * 0.25
      : 0;

  type IndexedRoom = { room: any; idx: number };
  const indexedWithBbox: IndexedRoom[] = rooms
    .map((r: any, idx: number) => ({ room: r, idx }))
    .filter((x: IndexedRoom) => x.room.bbox);

  indexedWithBbox.sort((a, b) => a.room.bbox.y - b.room.bbox.y);

  const layoutRows: IndexedRoom[][] = [];
  for (const item of indexedWithBbox) {
    if (layoutRows.length === 0) {
      layoutRows.push([item]);
    } else {
      const curRow = layoutRows[layoutRows.length - 1];
      const rowMinY = curRow[0].room.bbox.y;
      if (item.room.bbox.y - rowMinY <= rowYThreshold) {
        curRow.push(item);
      } else {
        layoutRows.push([item]);
      }
    }
  }

  layoutRows.sort((ra, rb) => ra[0].room.bbox.y - rb[0].room.bbox.y);
  for (const row of layoutRows) {
    row.sort((a, b) => a.room.bbox.x - b.room.bbox.x);
  }

  console.log('Layout rows detected:', layoutRows.length);
  layoutRows.forEach((row, i) => {
    console.log('Row', i, ':', row.map(r => r.room.name || r.room.label).join(', '));
  });

  function roomWidthMeters(r: any): number {
    return r.width_m > 0 ? r.width_m : r.bbox.width / pixelsPerMeter;
  }
  function roomDepthMeters(r: any): number {
    return r.depth_m > 0 ? r.depth_m : r.bbox.height / pixelsPerMeter;
  }

  const rowHeightsM: number[] = layoutRows.map(row =>
    Math.max(...row.map(({ room }) => roomDepthMeters(room)))
  );
  layoutTotalHeightM = rowHeightsM.reduce((a, b) => a + b, 0);
  for (const row of layoutRows) {
    const rowSumW = row.reduce((sum, { room }) => sum + roomWidthMeters(room), 0);
    layoutTotalWidthM = Math.max(layoutTotalWidthM, rowSumW);
  }

  let accumRowStartZ = 0;
  for (let ri = 0; ri < layoutRows.length; ri++) {
    const row = layoutRows[ri];
    let roomStartX = 0;
    for (const { room, idx } of row) {
      reconstructedPositions.set(idx, { newX: roomStartX, newZ: accumRowStartZ });
      roomStartX += roomWidthMeters(room);
    }
    accumRowStartZ += rowHeightsM[ri];
  }

  const roomRects: RoomRect[] = rooms.map((room: any, roomIndex: number) => {
    const bbox = room.bbox;
    const w = (room.width_m > 0 ? room.width_m : (bbox.width / pixelsPerMeter)) * modelScale;
    const d = (room.depth_m > 0 ? room.depth_m : (bbox.height / pixelsPerMeter)) * modelScale;
    const h = getRoomHeight(room.label);
    const rwM = room.width_m > 0 ? room.width_m : bbox.width / pixelsPerMeter;
    const rdM = room.depth_m > 0 ? room.depth_m : bbox.height / pixelsPerMeter;
    const recon = reconstructedPositions.get(roomIndex);
    let cx: number;
    let cz: number;
    if (recon) {
      cx = (recon.newX + rwM / 2 - layoutTotalWidthM / 2) * modelScale;
      cz = (recon.newZ + rdM / 2 - layoutTotalHeightM / 2) * modelScale;
    } else {
      cx = ((bbox.x + bbox.width / 2) / pixelsPerMeter - centerOffsetX) * modelScale;
      cz = ((bbox.y + bbox.height / 2) / pixelsPerMeter - centerOffsetY) * modelScale;
    }
    return {
      x0: cx - w / 2, z0: cz - d / 2, x1: cx + w / 2, z1: cz + d / 2,
      w, d, h, label: room.label, name: room.name || room.label,
      color: getRoomColor(room.label, room.material_class),
      materialClass: room.material_class || `space_${room.label}`,
    };
  });

  console.log('Reconstructed room positions:');
  roomRects.forEach(r => {
    console.log(
      r.name,
      '→ x0:',
      r.x0.toFixed(2),
      'z0:',
      r.z0.toFixed(2),
      'x1:',
      r.x1.toFixed(2),
      'z1:',
      r.z1.toFixed(2)
    );
  });

  // Building footprint for foundation
  let footMinX = Infinity, footMinZ = Infinity, footMaxX = -Infinity, footMaxZ = -Infinity;
  roomRects.forEach(r => {
    footMinX = Math.min(footMinX, r.x0); footMinZ = Math.min(footMinZ, r.z0);
    footMaxX = Math.max(footMaxX, r.x1); footMaxZ = Math.max(footMaxZ, r.z1);
  });
  if (!isFinite(footMinX)) { footMinX = -10; footMinZ = -8; footMaxX = 10; footMaxZ = 8; }

  // Foundation slab (extends 0.3m beyond building footprint)
  const PAD = 0.3;
  addBoxMesh("foundation",
    footMinX - PAD, -0.15, footMinZ - PAD,
    footMaxX + PAD, 0.0, footMaxZ + PAD,
    [0.22, 0.22, 0.24], 0.1, 0.8
  );

  // ===== Room floor slabs (thin, colored) =====
  const FLOOR_THICKNESS = 0.02;
  roomRects.forEach((r, i) => {
    addBoxMesh(
      `floor_${r.name}`,
      r.x0, 0.0, r.z0,
      r.x1, FLOOR_THICKNESS, r.z1,
      r.color, 0.0, 0.85
    );
  });

  // ===== Helper: check if a room edge is on the building perimeter =====
  function isPerimeterEdge(
    edgeAxis: 'x' | 'z', edgeVal: number,
    perpStart: number, perpEnd: number, side: 'min' | 'max', roomIdx: number
  ): boolean {
    const SNAP = 0.15; // tolerance for adjacency
    for (let j = 0; j < roomRects.length; j++) {
      if (j === roomIdx) continue;
      const other = roomRects[j];
      if (edgeAxis === 'x') {
        // Check if another room is adjacent on this X edge
        const otherEdge = side === 'min' ? other.x1 : other.x0;
        if (Math.abs(otherEdge - edgeVal) < SNAP) {
          // Check Z overlap
          const overlapStart = Math.max(perpStart, other.z0);
          const overlapEnd = Math.min(perpEnd, other.z1);
          if (overlapEnd - overlapStart > SNAP) return false; // has neighbor → interior
        }
      } else {
        const otherEdge = side === 'min' ? other.z1 : other.z0;
        if (Math.abs(otherEdge - edgeVal) < SNAP) {
          const overlapStart = Math.max(perpStart, other.x0);
          const overlapEnd = Math.min(perpEnd, other.x1);
          if (overlapEnd - overlapStart > SNAP) return false;
        }
      }
    }
    return true; // no neighbor found → perimeter
  }

  // ===== Helper: check if a door/window overlaps a wall segment =====
  interface Opening { cx: number; cz: number; halfW: number; isHorizontal: boolean; }
  const doorOpenings: (Opening & { doorH: number; doorW: number })[] = doors.map((door: any) => {
    const centerPx = door.center_x_px || (door.bbox.x + door.bbox.width / 2);
    const centerPy = door.center_y_px || (door.bbox.y + door.bbox.height / 2);
    const cx = (centerPx / pixelsPerMeter - centerOffsetX) * modelScale;
    const cz = (centerPy / pixelsPerMeter - centerOffsetY) * modelScale;
    const doorW = (door.width_m || STANDARD_DOOR_WIDTH) * modelScale;
    // Determine orientation from bbox
    const bboxW = door.bbox.width / pixelsPerMeter;
    const bboxH = door.bbox.height / pixelsPerMeter;
    return { cx, cz, halfW: doorW / 2, isHorizontal: bboxW >= bboxH, doorH: door.height_m || STANDARD_DOOR_HEIGHT, doorW };
  });

  const windowOpenings: (Opening & { winW: number; winH: number; sillH: number })[] = windows.map((win: any) => {
    const centerPx = win.center_x_px || (win.bbox.x + win.bbox.width / 2);
    const centerPy = win.center_y_px || (win.bbox.y + win.bbox.height / 2);
    const cx = (centerPx / pixelsPerMeter - centerOffsetX) * modelScale;
    const cz = (centerPy / pixelsPerMeter - centerOffsetY) * modelScale;
    const winW = (win.width_m || 0.9) * modelScale;
    const bboxW = win.bbox.width / pixelsPerMeter;
    const bboxH = win.bbox.height / pixelsPerMeter;
    return {
      cx, cz, halfW: winW / 2, isHorizontal: bboxW >= bboxH,
      winW, winH: win.height_m || STANDARD_WINDOW_HEIGHT,
      sillH: win.sill_height_m || STANDARD_WINDOW_SILL,
    };
  });

  function getOverlappingDoor(
    wallStart: number, wallEnd: number, wallPerp: number,
    isHorizontalWall: boolean, tolerance: number
  ): (Opening & { doorH: number; doorW: number })[] {
    return doorOpenings.filter(d => {
      if (d.isHorizontal !== isHorizontalWall) return false;
      const perpCoord = isHorizontalWall ? d.cz : d.cx;
      const mainCoord = isHorizontalWall ? d.cx : d.cz;
      return Math.abs(perpCoord - wallPerp) < tolerance &&
             mainCoord - d.halfW < wallEnd && mainCoord + d.halfW > wallStart;
    });
  }

  function getOverlappingWindows(
    wallStart: number, wallEnd: number, wallPerp: number,
    isHorizontalWall: boolean, tolerance: number
  ): (Opening & { winW: number; winH: number; sillH: number })[] {
    return windowOpenings.filter(w => {
      if (w.isHorizontal !== isHorizontalWall) return false;
      const perpCoord = isHorizontalWall ? w.cz : w.cx;
      const mainCoord = isHorizontalWall ? w.cx : w.cz;
      return Math.abs(perpCoord - wallPerp) < tolerance &&
             mainCoord - w.halfW < wallEnd && mainCoord + w.halfW > wallStart;
    });
  }

  // ===== Generate walls from room perimeters =====
  let wallIdx = 0;
  roomRects.forEach((r, ri) => {
    // 4 edges: left (x0), right (x1), top/front (z0), bottom/back (z1)
    const edges: { axis: 'x' | 'z'; val: number; start: number; end: number; side: 'min' | 'max'; isHorizontal: boolean }[] = [
      { axis: 'x', val: r.x0, start: r.z0, end: r.z1, side: 'min', isHorizontal: false }, // left wall (vertical)
      { axis: 'x', val: r.x1, start: r.z0, end: r.z1, side: 'max', isHorizontal: false }, // right wall
      { axis: 'z', val: r.z0, start: r.x0, end: r.x1, side: 'min', isHorizontal: true },  // front wall (horizontal)
      { axis: 'z', val: r.z1, start: r.x0, end: r.x1, side: 'max', isHorizontal: true },  // back wall
    ];

    edges.forEach(edge => {
      const isExt = isPerimeterEdge(edge.axis, edge.val, edge.start, edge.end, edge.side, ri);
      const thickness = isExt ? EXTERIOR_WALL_THICKNESS : INTERIOR_WALL_THICKNESS;
      const wallHeight = isExt ? 3.0 : r.h;
      const wallColor = isExt ? WALL_COLORS.exterior_wall : WALL_COLORS.interior_wall;
      const halfT = thickness / 2;

      // Check for door/window openings on this edge
      const tolerance = isExt ? thickness + 0.3 : thickness + 0.2;
      const overlappingDoors = getOverlappingDoor(edge.start, edge.end, edge.val, edge.isHorizontal, tolerance);
      const overlappingWins = getOverlappingWindows(edge.start, edge.end, edge.val, edge.isHorizontal, tolerance);

      // Collect cut ranges along the wall's main axis
      type CutRange = { start: number; end: number; type: 'door' | 'window'; doorH?: number; sillH?: number; winH?: number };
      const cuts: CutRange[] = [];
      overlappingDoors.forEach(d => {
        const main = edge.isHorizontal ? d.cx : d.cz;
        cuts.push({ start: main - d.halfW, end: main + d.halfW, type: 'door', doorH: d.doorH });
      });
      overlappingWins.forEach(w => {
        const main = edge.isHorizontal ? w.cx : w.cz;
        cuts.push({ start: main - w.halfW, end: main + w.halfW, type: 'window', sillH: w.sillH, winH: w.winH });
      });
      cuts.sort((a, b) => a.start - b.start);

      // Generate wall segments with cuts
      let cursor = edge.start;
      const segments: { s: number; e: number }[] = [];
      cuts.forEach(cut => {
        const clampedStart = Math.max(cut.start, edge.start);
        const clampedEnd = Math.min(cut.end, edge.end);
        if (clampedStart > cursor + 0.05) {
          segments.push({ s: cursor, e: clampedStart });
        }
        // For doors: add wall above door (lintel)
        if (cut.type === 'door' && cut.doorH && cut.doorH < wallHeight) {
          if (edge.isHorizontal) {
            addBoxMesh(`lintel_${wallIdx}`,
              clampedStart, cut.doorH, edge.val - halfT,
              clampedEnd, wallHeight, edge.val + halfT,
              wallColor, isExt ? 0.15 : 0.0, isExt ? 0.6 : 0.9);
          } else {
            addBoxMesh(`lintel_${wallIdx}`,
              edge.val - halfT, cut.doorH, clampedStart,
              edge.val + halfT, wallHeight, clampedEnd,
              wallColor, isExt ? 0.15 : 0.0, isExt ? 0.6 : 0.9);
          }
          wallIdx++;
        }
        // For windows: add wall below sill + above window + glass pane
        if (cut.type === 'window') {
          const sill = cut.sillH || STANDARD_WINDOW_SILL;
          const winH = cut.winH || STANDARD_WINDOW_HEIGHT;
          // Wall below sill
          if (sill > 0.05) {
            if (edge.isHorizontal) {
              addBoxMesh(`sill_wall_${wallIdx}`,
                clampedStart, 0, edge.val - halfT,
                clampedEnd, sill, edge.val + halfT,
                wallColor, isExt ? 0.15 : 0.0, isExt ? 0.6 : 0.9);
            } else {
              addBoxMesh(`sill_wall_${wallIdx}`,
                edge.val - halfT, 0, clampedStart,
                edge.val + halfT, sill, clampedEnd,
                wallColor, isExt ? 0.15 : 0.0, isExt ? 0.6 : 0.9);
            }
            wallIdx++;
          }
          // Wall above window
          if (sill + winH < wallHeight - 0.05) {
            if (edge.isHorizontal) {
              addBoxMesh(`header_${wallIdx}`,
                clampedStart, sill + winH, edge.val - halfT,
                clampedEnd, wallHeight, edge.val + halfT,
                wallColor, isExt ? 0.15 : 0.0, isExt ? 0.6 : 0.9);
            } else {
              addBoxMesh(`header_${wallIdx}`,
                edge.val - halfT, sill + winH, clampedStart,
                edge.val + halfT, wallHeight, clampedEnd,
                wallColor, isExt ? 0.15 : 0.0, isExt ? 0.6 : 0.9);
            }
            wallIdx++;
          }
          // Glass pane
          const glassThin = 0.02;
          if (edge.isHorizontal) {
            addBoxMesh(`glass_${wallIdx}`,
              clampedStart, sill, edge.val - glassThin,
              clampedEnd, sill + winH, edge.val + glassThin,
              [0.53, 0.81, 0.92], 0.3, 0.2);
          } else {
            addBoxMesh(`glass_${wallIdx}`,
              edge.val - glassThin, sill, clampedStart,
              edge.val + glassThin, sill + winH, clampedEnd,
              [0.53, 0.81, 0.92], 0.3, 0.2);
          }
          wallIdx++;
        }
        // Door slab geometry
        if (cut.type === 'door') {
          const doorThin = 0.04;
          const dH = cut.doorH || STANDARD_DOOR_HEIGHT;
          if (edge.isHorizontal) {
            addBoxMesh(`door_panel_${wallIdx}`,
              clampedStart, 0, edge.val - doorThin,
              clampedEnd, dH, edge.val + doorThin,
              [0.55, 0.35, 0.15], 0.0, 0.7);
          } else {
            addBoxMesh(`door_panel_${wallIdx}`,
              edge.val - doorThin, 0, clampedStart,
              edge.val + doorThin, dH, clampedEnd,
              [0.55, 0.35, 0.15], 0.0, 0.7);
          }
          wallIdx++;
        }
        cursor = clampedEnd;
      });
      if (cursor < edge.end - 0.05) {
        segments.push({ s: cursor, e: edge.end });
      }
      if (cuts.length === 0) {
        segments.push({ s: edge.start, e: edge.end });
      }

      // Render solid wall segments
      segments.forEach(seg => {
        if (edge.isHorizontal) {
          addBoxMesh(`wall_${wallIdx}`,
            seg.s, 0, edge.val - halfT,
            seg.e, wallHeight, edge.val + halfT,
            wallColor, isExt ? 0.15 : 0.0, isExt ? 0.6 : 0.9);
        } else {
          addBoxMesh(`wall_${wallIdx}`,
            edge.val - halfT, 0, seg.s,
            edge.val + halfT, wallHeight, seg.e,
            wallColor, isExt ? 0.15 : 0.0, isExt ? 0.6 : 0.9);
        }
        wallIdx++;
      });
    });
  });

  // Combine all binary chunks into GLB
  const totalBinarySize = bufferOffset;
  const combinedBuffer = new Uint8Array(totalBinarySize);
  let writeOffset = 0;
  for (const chunk of bufferChunks) {
    combinedBuffer.set(chunk, writeOffset);
    writeOffset += chunk.byteLength;
  }

  const sceneNodes = nodeList.map((meshIdx, i) => ({ name: `node_${i}`, mesh: meshIdx }));
  const nodeIndices = sceneNodes.map((_, i) => i);

  const gltfJson = {
    asset: { version: "2.0", generator: "CitadelTwin Geometric Reconstruction v5" },
    scene: 0,
    scenes: [{ name: "CitadelTwin Geometric Reconstruction", nodes: nodeIndices }],
    nodes: sceneNodes,
    meshes, materials, accessors, bufferViews,
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
  view.setUint32(off, 0x46546C67, true); off += 4; // magic
  view.setUint32(off, 2, true); off += 4; // version
  view.setUint32(off, totalSize, true); off += 4; // total length

  view.setUint32(off, jsonPaddedLen, true); off += 4; // JSON chunk length
  view.setUint32(off, 0x4E4F534A, true); off += 4; // JSON chunk type
  bytes.set(jsonBuf, off); off += jsonBuf.length;
  for (let i = 0; i < jsonPad; i++) bytes[off++] = 0x20;

  view.setUint32(off, totalBinarySize, true); off += 4; // BIN chunk length
  view.setUint32(off, 0x004E4942, true); off += 4; // BIN chunk type
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

  const roomDivs = rooms.map((room: any) => {
    const key = (room.label || '').toLowerCase().replace(/\s+/g, '_');
    const c = colors[key] || defaultColor;
    const lx = Math.round(room.bbox.x * scaleFactor);
    const ly = Math.round(room.bbox.y * scaleFactor);
    const lw = Math.max(Math.round(room.bbox.width * scaleFactor), 30);
    const lh = Math.max(Math.round(room.bbox.height * scaleFactor), 20);
    const shortName = (room.name || room.label).replace(/_/g, ' ');
    const dimText = room.original_dimension_text || (room.width_m > 0 ? `${room.width_m?.toFixed(1)}×${room.depth_m?.toFixed(1)}m` : 'est.');
    const area = room.area_m2 > 0 ? `${room.area_m2?.toFixed(1)}m²` : '';
    const fontSize = lw < 70 ? '8px' : lw < 100 ? '9px' : '10px';
    return `<div style="
      position:absolute;left:${lx}px;top:${ly}px;width:${lw}px;height:${lh}px;
      background:${c.bg};border:2px solid ${c.border};border-radius:3px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      text-align:center;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.25);cursor:default;
    " title="${room.name}: ${dimText} ${area}">
      <div style="font-size:${fontSize};font-weight:700;color:${c.text};line-height:1.2;padding:2px;">${shortName}</div>
      <div style="font-size:8px;color:${c.text};opacity:0.85;">${dimText}</div>
      ${area ? `<div style="font-size:8px;color:${c.text};opacity:0.7;">${area}</div>` : ''}
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

  const scaleLabel = scaleInfo.scale_source === 'door_calibration'
    ? 'Scale: Door-calibrated (36"/0.9m ref)'
    : scaleInfo.scale_text
    ? `Scale: ${scaleInfo.scale_text}`
    : scaleInfo.unit_system
    ? `Units: ${scaleInfo.unit_system}`
    : '';

  return `<div style="font-family:system-ui,sans-serif;background:#1a1a2e;padding:20px;border-radius:8px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;font-size:16px;font-weight:700;color:#e2e8f0;">
        🏠 Geometric Reconstruction — ${rooms.length} rooms
        ${elements.building_info?.total_area_sqft ? `<span style="font-size:12px;font-weight:400;color:#94a3b8;margin-left:8px;">${elements.building_info.total_area_sqft} sq ft</span>` : ''}
        ${scaleLabel ? `<span style="font-size:11px;color:#94a3b8;margin-left:8px;">${scaleLabel}</span>` : ''}
      </h3>
      <div style="display:flex;gap:12px;font-size:11px;color:#94a3b8;">
        ${doors.length > 0 ? `<span>🚪 ${doors.length} doors</span>` : ''}
        ${windows.length > 0 ? `<span>🪟 ${windows.length} windows</span>` : ''}
        ${extWalls > 0 ? `<span>🧱 ${extWalls} ext (${EXTERIOR_WALL_THICKNESS}m)</span>` : ''}
        ${intWalls > 0 ? `<span>📐 ${intWalls} int (${INTERIOR_WALL_THICKNESS}m)</span>` : ''}
      </div>
    </div>

    <div style="position:relative;display:inline-block;background:#0f172a;border:1px solid #334155;border-radius:4px;overflow:hidden;min-width:${Math.round(maxRight * scaleFactor) + 20}px;min-height:${Math.round(maxBottom * scaleFactor) + 20}px;">
      <div style="position:relative;margin:10px;">
        ${roomDivs}
        ${doorDivs}
        ${windowDivs}
      </div>
    </div>

    <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px 16px;">
      ${legendItems}
      ${doors.length > 0 ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;"><div style="width:14px;height:14px;background:#8B4513;border-radius:2px;flex-shrink:0;"></div><span>door</span></div>` : ''}
      ${windows.length > 0 ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;"><div style="width:14px;height:14px;background:#87CEEB;border:1px solid #4488AA;flex-shrink:0;"></div><span>window</span></div>` : ''}
      ${extWalls > 0 ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;"><div style="width:14px;height:14px;background:#40404acc;border:1px solid #303035;border-radius:2px;flex-shrink:0;"></div><span>exterior wall (8")</span></div>` : ''}
      ${intWalls > 0 ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;"><div style="width:14px;height:14px;background:#d9d4cccc;border:1px solid #999;border-radius:2px;flex-shrink:0;"></div><span>interior wall (5")</span></div>` : ''}
    </div>
  </div>`;
}
