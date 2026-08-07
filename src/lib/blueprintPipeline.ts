/**
 * Shared definition of the YOLO + EasyOCR blueprint pipeline's URL and
 * request/response shape — mirrors BlueprintUpload.tsx's trigger3DGeneration
 * exactly (same URL, same POST body, same response fields). That file is not
 * modified to use this helper; it keeps its own inline copy. This exists so
 * any other caller (e.g. the Client Portal) has one place to read the real
 * field names from, verified against how they're actually consumed in
 * UploadResultsTabs.tsx (getDimensions(), wall_type filters, scaleInfo/
 * buildingInfo rendering).
 */

export const BLUEPRINT_PIPELINE_URL = 'https://sathvikvadavatha-citadeltwin-pipeline.hf.space';

// Room items are defensively read in UploadResultsTabs.tsx via several possible
// key names — label/class/type for the room label, and either precise OCR-derived
// width_m/depth_m/area_m2 (+ width_ft/depth_ft/original_dimension_text) or a
// generic `dimensions` object. Both shapes are kept here since the app already
// treats them as real, live possibilities from this exact endpoint.
export interface BlueprintPipelineRoom {
  label?: string;
  class?: string;
  type?: string;
  name?: string;
  confidence?: number;
  bbox?: { x: number; y: number; width: number; height: number };
  width_m?: number | string;
  depth_m?: number | string;
  area_m2?: number | string;
  width_ft?: number | string;
  depth_ft?: number | string;
  original_dimension_text?: string;
  dimensions?: {
    width?: number | string;
    length?: number | string;
    depth?: number | string;
    area?: number | string;
    units?: string;
  };
  [key: string]: unknown;
}

// Confirmed via UploadResultsTabs.tsx's wall_type filters ('exterior_wall' | 'interior_wall' | 'load_bearing_wall').
export interface BlueprintPipelineWall {
  wall_type?: 'exterior_wall' | 'interior_wall' | 'load_bearing_wall' | string;
  [key: string]: unknown;
}

// Confirmed via UploadResultsTabs.tsx: uploadResult.scaleInfo.unit_system / .scale_source / .scale_text.
export interface BlueprintPipelineScaleInfo {
  scale_text?: string;
  scale_source?: 'text' | 'bar' | 'estimated' | 'none' | string;
  pixels_per_meter?: number;
  unit_system?: 'imperial' | 'metric' | string;
  [key: string]: unknown;
}

// Confirmed via UploadResultsTabs.tsx: uploadResult.buildingInfo.total_area_sqft.
export interface BlueprintPipelineBuildingInfo {
  total_area_sqft?: number;
  total_area_m2?: number;
  building_type?: string;
  num_floors?: number;
  exterior_wall_thickness_m?: number;
  interior_wall_thickness_m?: number;
  num_exterior_walls?: number;
  num_interior_walls?: number;
  num_doors?: number;
  num_windows?: number;
  [key: string]: unknown;
}

export interface BlueprintPipelineMetadata {
  walls?: BlueprintPipelineWall[];
  scale?: BlueprintPipelineScaleInfo;
  building?: BlueprintPipelineBuildingInfo;
  [key: string]: unknown;
}

// Confirmed via BlueprintUpload.tsx's trigger3DGeneration: const { glb_base64, rooms, metadata } = pipelineData.
export interface BlueprintPipelineResponse {
  glb_base64?: string;
  rooms?: BlueprintPipelineRoom[];
  metadata?: BlueprintPipelineMetadata;
  [key: string]: unknown;
}

/**
 * POSTs a public blueprint image URL to the pipeline's /process endpoint —
 * identical request shape to BlueprintUpload.tsx's trigger3DGeneration.
 */
export const callBlueprintPipeline = async (imageUrl: string): Promise<BlueprintPipelineResponse> => {
  const response = await fetch(`${BLUEPRINT_PIPELINE_URL}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  if (!response.ok) {
    throw new Error(`Pipeline error: ${response.statusText}`);
  }

  return response.json();
};

/** Decodes the pipeline's base64 GLB into raw bytes — same decode BlueprintUpload.tsx uses. */
export const decodeGlbBase64 = (glbBase64: string): Uint8Array =>
  Uint8Array.from(atob(glbBase64), (c) => c.charCodeAt(0));

/** Best-effort display label for a room, mirroring UploadResultsTabs.tsx's tolerant lookup. */
export const getRoomLabel = (room: BlueprintPipelineRoom, index: number): string => {
  const rawLabel =
    room.label || (room.class ? room.class.replace(/^space_/, '') : '') || room.type || '';
  if (room.name) return room.name;
  return rawLabel ? rawLabel.replace(/_/g, ' ') : `Room ${index + 1}`;
};

/** Best-effort dimensions/area text for a room, mirroring UploadResultsTabs.tsx's getDimensions(). */
export const getRoomDimensionsText = (room: BlueprintPipelineRoom): string | null => {
  if (room.width_m && room.depth_m) {
    const area = room.area_m2 ?? (parseFloat(String(room.width_m)) * parseFloat(String(room.depth_m))).toFixed(1);
    if (room.width_ft && room.depth_ft) {
      return `${room.width_ft}' × ${room.depth_ft}' — ${Math.round(
        parseFloat(String(room.width_ft)) * parseFloat(String(room.depth_ft))
      )} sq ft`;
    }
    return `${room.width_m}m × ${room.depth_m}m — ${area} m²`;
  }

  if (room.dimensions) {
    const { width, length, depth, area, units } = room.dimensions;
    const depthOrLength = length ?? depth;
    if (width != null && depthOrLength != null) {
      return `${width} × ${depthOrLength} ${units ?? 'ft'}${area != null ? ` — ${area} sq ${units ?? 'ft'}` : ''}`;
    }
  }

  if (room.bbox) {
    return `${Math.round(room.bbox.width)}×${Math.round(room.bbox.height)} px`;
  }

  return null;
};
