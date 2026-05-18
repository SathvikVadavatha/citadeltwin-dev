import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  latitude: number;
  longitude: number;
  placeName: string;
  placeTypes?: string[];
}

interface EnvironmentalAnalysis {
  floodRisk?: {
    level: string;
    severity: 'low' | 'moderate' | 'high';
    description: string;
  };
  protectedAreas?: Array<{
    name: string;
    distance: string;
    type: string;
  }>;
  soilType?: {
    description: string;
    buildingSuitability: string;
  };
}

// Point-in-polygon test using the ray-casting algorithm
function pointInPolygon(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInFeature(lat: number, lng: number, feature: any): boolean {
  const geom = feature?.geometry;
  if (!geom) return false;

  if (geom.type === 'Polygon') {
    const outer = geom.coordinates?.[0];
    if (Array.isArray(outer) && pointInPolygon(lat, lng, outer)) {
      return true;
    }
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates || []) {
      const outer = poly?.[0];
      if (Array.isArray(outer) && pointInPolygon(lat, lng, outer)) {
        return true;
      }
    }
  }
  return false;
}

// Haversine distance in miles
function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function centroidOfFeature(feature: any): { lat: number; lng: number } | null {
  const geom = feature?.geometry;
  if (!geom) return null;

  const ring: number[][] | undefined =
    geom.type === 'Polygon'
      ? geom.coordinates?.[0]
      : geom.type === 'MultiPolygon'
        ? geom.coordinates?.[0]?.[0]
        : undefined;

  if (!ring || ring.length === 0) return null;

  let sumLat = 0;
  let sumLng = 0;
  for (const [lng, lat] of ring) {
    sumLat += lat;
    sumLng += lng;
  }
  return { lat: sumLat / ring.length, lng: sumLng / ring.length };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { latitude, longitude, placeName }: AnalysisRequest = await req.json();

    console.log(`Analyzing environmental factors for ${placeName} at (${latitude}, ${longitude})`);

    const analysis: EnvironmentalAnalysis = {};

    const floodRisk = await analyzeFloodRisk(supabaseClient, latitude, longitude);
    if (floodRisk) {
      analysis.floodRisk = floodRisk;
    }

    const protectedAreas = await findNearbyProtectedAreas(supabaseClient, latitude, longitude);
    if (protectedAreas.length > 0) {
      analysis.protectedAreas = protectedAreas;
    }

    const soilAnalysis = await analyzeSoilConditions(supabaseClient, latitude, longitude);
    if (soilAnalysis) {
      analysis.soilType = soilAnalysis;
    }

    console.log('Environmental analysis completed:', analysis);

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in environmental analysis:', error);
    return new Response(
      JSON.stringify({
        error: 'Environmental analysis failed',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Real flood risk: look up cached FEMA polygons in gis_layers and test point-in-polygon
async function analyzeFloodRisk(supabaseClient: any, lat: number, lng: number) {
  try {
    const { data: floodLayers, error } = await supabaseClient
      .from('gis_layers')
      .select('geometry_data,metadata')
      .eq('layer_type', 'flood_zones')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error querying flood layers:', error);
      return {
        level: 'Unknown',
        severity: 'low' as const,
        description: 'Flood zone data unavailable for this location.'
      };
    }

    let matchedZone: string | null = null;

    for (const layer of floodLayers || []) {
      const geom = layer?.geometry_data;
      const features = geom?.features;
      if (!Array.isArray(features)) continue;

      for (const feature of features) {
        if (pointInFeature(lat, lng, feature)) {
          matchedZone = String(feature?.properties?.FLD_ZONE ?? 'Unknown');
          break;
        }
      }
      if (matchedZone) break;
    }

    if (!matchedZone) {
      return {
        level: 'Low',
        severity: 'low' as const,
        description: 'No FEMA flood zone polygon intersects this point. Likely Zone X (minimal flood risk).'
      };
    }

    if (['VE', 'V'].some((c) => matchedZone!.includes(c))) {
      return {
        level: 'High',
        severity: 'high' as const,
        description: `Property is in FEMA Zone ${matchedZone} — Coastal High Hazard Area. Flood insurance is required.`
      };
    }

    if (['AE', 'AH', 'AO', 'A'].some((c) => matchedZone!.includes(c))) {
      return {
        level: 'High',
        severity: 'high' as const,
        description: `Property is in FEMA Zone ${matchedZone} — Special Flood Hazard Area. Flood insurance is required.`
      };
    }

    if (matchedZone.includes('X500')) {
      return {
        level: 'Moderate',
        severity: 'moderate' as const,
        description: `Property is in FEMA Zone ${matchedZone} — 0.2% annual chance flood hazard. Flood insurance recommended.`
      };
    }

    return {
      level: 'Low',
      severity: 'low' as const,
      description: `Property is in FEMA Zone ${matchedZone} — minimal flood risk area.`
    };
  } catch (error) {
    console.error('Error analyzing flood risk:', error);
    return null;
  }
}

// Real protected areas: pull cached PAD-US polygons and compute haversine distance
async function findNearbyProtectedAreas(supabaseClient: any, lat: number, lng: number) {
  try {
    const { data: layers, error } = await supabaseClient
      .from('gis_layers')
      .select('geometry_data')
      .eq('environmental_type', 'protected_lands')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error querying protected areas:', error);
      return [];
    }

    const candidates: Array<{ name: string; distance: number; type: string }> = [];

    for (const layer of layers || []) {
      const features = layer?.geometry_data?.features;
      if (!Array.isArray(features)) continue;

      for (const feature of features) {
        const centroid = centroidOfFeature(feature);
        if (!centroid) continue;

        const distance = haversineMiles(lat, lng, centroid.lat, centroid.lng);
        const name = String(feature?.properties?.Unit_Nm ?? 'Protected Area');
        const type = String(feature?.properties?.Des_Tp ?? 'Protected Land');

        candidates.push({ name, distance, type });
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);
    return candidates.slice(0, 5).map((c) => ({
      name: c.name,
      distance: `${c.distance.toFixed(1)} miles`,
      type: c.type
    }));
  } catch (error) {
    console.error('Error finding protected areas:', error);
    return [];
  }
}

// Real soils: pull cached NRCS polygons and test point-in-polygon
async function analyzeSoilConditions(supabaseClient: any, lat: number, lng: number) {
  try {
    const { data: layers, error } = await supabaseClient
      .from('gis_layers')
      .select('geometry_data')
      .eq('environmental_type', 'soils')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error querying soils:', error);
      return null;
    }

    for (const layer of layers || []) {
      const features = layer?.geometry_data?.features;
      if (!Array.isArray(features)) continue;

      for (const feature of features) {
        if (pointInFeature(lat, lng, feature)) {
          const name = String(feature?.properties?.MUNAME ?? 'Unknown soil');
          const drainage = String(feature?.properties?.DRCLASSDCD ?? '');
          const hydgrp = String(feature?.properties?.HYDGRP ?? '');

          let buildingSuitability = 'Good for most construction types';
          const lower = (drainage + ' ' + name).toLowerCase();
          if (lower.includes('poor') || lower.includes('very poor') || hydgrp.startsWith('D')) {
            buildingSuitability = 'Poorly drained soil — drainage and foundation engineering required';
          } else if (lower.includes('clay')) {
            buildingSuitability = 'Clay-rich soil — review for expansive behavior; specialized foundation may be needed';
          } else if (lower.includes('sand')) {
            buildingSuitability = 'Sandy soil — requires special foundation considerations';
          } else if (hydgrp === 'A') {
            buildingSuitability = 'Well-drained soil — generally favorable for construction';
          }

          return {
            description: drainage ? `${name} (${drainage})` : name,
            buildingSuitability
          };
        }
      }
    }

    return {
      description: 'Soil survey data unavailable for this location',
      buildingSuitability: 'Site-specific geotechnical investigation recommended'
    };
  } catch (error) {
    console.error('Error analyzing soil conditions:', error);
    return null;
  }
}
