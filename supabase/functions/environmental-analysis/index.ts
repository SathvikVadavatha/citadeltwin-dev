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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { latitude, longitude, placeName, placeTypes }: AnalysisRequest = await req.json();

    console.log(`Analyzing environmental factors for ${placeName} at (${latitude}, ${longitude})`);

    const analysis: EnvironmentalAnalysis = {};

    // Analyze flood risk based on location
    const floodRisk = await analyzeFloodRisk(supabaseClient, latitude, longitude);
    if (floodRisk) {
      analysis.floodRisk = floodRisk;
    }

    // Check for nearby protected areas
    const protectedAreas = await findNearbyProtectedAreas(supabaseClient, latitude, longitude);
    if (protectedAreas.length > 0) {
      analysis.protectedAreas = protectedAreas;
    }

    // Analyze soil conditions
    const soilAnalysis = await analyzeSoilConditions(latitude, longitude);
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
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function analyzeFloodRisk(supabaseClient: any, lat: number, lng: number) {
  try {
    // Query flood zone data from environmental_layers table
    const { data: floodData, error } = await supabaseClient
      .from('environmental_layers')
      .select('*')
      .eq('layer_type', 'flood_zones')
      .limit(5);

    if (error) {
      console.error('Error querying flood data:', error);
      return null;
    }

    // For demo purposes, simulate flood risk based on coordinates
    // In production, this would use spatial queries against actual flood zone geometries
    let floodRisk = 'Low';
    let severity: 'low' | 'moderate' | 'high' = 'low';
    let description = 'Property is located in a minimal flood risk area (Zone X).';

    // Simple heuristic: areas near water bodies (lower elevation simulation)
    const riskFactor = Math.abs(Math.sin(lat * 10) * Math.cos(lng * 10));
    
    if (riskFactor > 0.7) {
      floodRisk = 'High';
      severity = 'high';
      description = 'Property is in FEMA Zone AE - Special Flood Hazard Area. Flood insurance is required.';
    } else if (riskFactor > 0.4) {
      floodRisk = 'Moderate';
      severity = 'moderate';
      description = 'Property is in FEMA Zone A - Flood hazard area. Flood insurance is recommended.';
    }

    return {
      level: floodRisk,
      severity,
      description
    };

  } catch (error) {
    console.error('Error analyzing flood risk:', error);
    return null;
  }
}

async function findNearbyProtectedAreas(supabaseClient: any, lat: number, lng: number) {
  try {
    // Query protected areas from environmental_layers table
    const { data: protectedData, error } = await supabaseClient
      .from('environmental_layers')
      .select('*')
      .eq('environmental_type', 'protected_lands')
      .limit(10);

    if (error) {
      console.error('Error querying protected areas:', error);
      return [];
    }

    // For demo purposes, simulate nearby protected areas
    // In production, this would use spatial distance calculations
    const nearbyAreas = [];
    
    // Simulate some protected areas based on location
    if (lat > 28 && lat < 30 && lng > -82 && lng < -80) {
      // Central Florida area
      nearbyAreas.push({
        name: 'Wekiwa Springs State Park',
        distance: '2.1 miles',
        type: 'State Park'
      });
      
      if (Math.random() > 0.5) {
        nearbyAreas.push({
          name: 'Ocala National Forest',
          distance: '15.3 miles',
          type: 'National Forest'
        });
      }
    } else if (lat > 41 && lat < 42 && lng > -82 && lng < -81) {
      // Northeast Ohio area
      nearbyAreas.push({
        name: 'Cuyahoga Valley National Park',
        distance: '8.7 miles',
        type: 'National Park'
      });
    }

    return nearbyAreas;

  } catch (error) {
    console.error('Error finding protected areas:', error);
    return [];
  }
}

async function analyzeSoilConditions(lat: number, lng: number) {
  try {
    // Simulate soil analysis based on geographic location
    // In production, this would query USDA soil survey data or similar
    
    let soilType = 'Mixed alluvial soils';
    let buildingSuitability = 'Good for most construction types';

    // Simple geographic heuristics
    if (lat > 28 && lat < 30) {
      // Florida - sandy soils
      soilType = 'Sandy soils with organic matter';
      buildingSuitability = 'Requires special foundation considerations due to sandy composition';
    } else if (lat > 41 && lat < 42) {
      // Ohio - clay soils
      soilType = 'Clay-rich glacial soils';
      buildingSuitability = 'Good bearing capacity, may require drainage considerations';
    }

    return {
      description: soilType,
      buildingSuitability
    };

  } catch (error) {
    console.error('Error analyzing soil conditions:', error);
    return null;
  }
}