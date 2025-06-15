
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  analysisId: string;
  geometry: any;
  material: any;
  loads: any[];
  boundaryConditions: any[];
  meshSettings?: any;
}

// Simplified FEA calculations for basic structural analysis
class SimpleFEASolver {
  
  // Calculate beam deflection using Euler-Bernoulli beam theory
  calculateBeamDeflection(length: number, load: number, elasticModulus: number, momentOfInertia: number): number {
    // For simply supported beam with point load at center: δ = PL³/(48EI)
    return (load * Math.pow(length, 3)) / (48 * elasticModulus * momentOfInertia);
  }

  // Calculate beam stress
  calculateBeamStress(moment: number, yMax: number, momentOfInertia: number): number {
    // σ = My/I
    return (moment * yMax) / momentOfInertia;
  }

  // Calculate column buckling load (Euler's formula)
  calculateBucklingLoad(elasticModulus: number, momentOfInertia: number, length: number, endCondition: number = 1): number {
    // Pcr = π²EI/(KL)² where K is end condition factor
    return (Math.PI * Math.PI * elasticModulus * momentOfInertia) / Math.pow(endCondition * length, 2);
  }

  // Simplified static analysis for basic elements
  performStaticAnalysis(geometry: any, material: any, loads: any[], boundaryConditions: any[]): any {
    const results = {
      displacements: [],
      stresses: [],
      reactions: [],
      maxDisplacement: 0,
      maxStress: 0,
      safetyFactor: 0
    };

    // Material properties with defaults
    const E = material.properties?.elastic_modulus || 200e9; // Steel default (Pa)
    const yieldStrength = material.properties?.yield_strength || 250e6; // Steel default (Pa)
    const density = material.properties?.density || 7850; // Steel default (kg/m³)

    // Basic geometry analysis
    const length = geometry.dimensions?.length || 1;
    const width = geometry.dimensions?.width || 0.1;
    const height = geometry.dimensions?.height || 0.1;
    
    // Calculate section properties
    const area = width * height;
    const momentOfInertia = (width * Math.pow(height, 3)) / 12;

    // Process loads
    loads.forEach((load, index) => {
      let displacement = 0;
      let stress = 0;

      switch (load.load_type) {
        case 'point_load':
          displacement = this.calculateBeamDeflection(length, load.magnitude, E, momentOfInertia);
          const moment = (load.magnitude * length) / 4; // Max moment for simply supported beam
          stress = this.calculateBeamStress(moment, height / 2, momentOfInertia);
          break;
        
        case 'distributed_load':
          // For uniformly distributed load
          displacement = (5 * load.magnitude * Math.pow(length, 4)) / (384 * E * momentOfInertia);
          const maxMoment = (load.magnitude * Math.pow(length, 2)) / 8;
          stress = this.calculateBeamStress(maxMoment, height / 2, momentOfInertia);
          break;
        
        case 'gravity':
          const weight = density * area * length * 9.81;
          displacement = (5 * weight * Math.pow(length, 4)) / (384 * E * momentOfInertia);
          stress = (weight * length * height) / (8 * momentOfInertia);
          break;
      }

      results.displacements.push({
        loadIndex: index,
        value: displacement,
        location: load.location,
        direction: 'y'
      });

      results.stresses.push({
        loadIndex: index,
        value: stress,
        location: load.location,
        type: 'bending'
      });

      results.maxDisplacement = Math.max(results.maxDisplacement, Math.abs(displacement));
      results.maxStress = Math.max(results.maxStress, Math.abs(stress));
    });

    // Calculate safety factor
    results.safetyFactor = results.maxStress > 0 ? yieldStrength / results.maxStress : 999;

    // Calculate reactions (simplified)
    const totalLoad = loads.reduce((sum, load) => sum + load.magnitude, 0);
    results.reactions = boundaryConditions.map((bc, index) => ({
      conditionIndex: index,
      force: totalLoad / boundaryConditions.length,
      location: bc.location
    }));

    return results;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { analysisId, geometry, material, loads, boundaryConditions, meshSettings } = await req.json() as AnalysisRequest

    console.log(`Starting FEA analysis for ID: ${analysisId}`)

    // Update analysis status to running
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    // Initialize FEA solver
    const solver = new SimpleFEASolver()

    // Perform the analysis
    const results = solver.performStaticAnalysis(geometry, material, loads, boundaryConditions)

    // Store results in database
    const resultEntries = [
      {
        analysis_id: analysisId,
        result_type: 'displacement',
        data: { values: results.displacements, max: results.maxDisplacement },
        metadata: { units: 'm', coordinate_system: 'global' }
      },
      {
        analysis_id: analysisId,
        result_type: 'stress',
        data: { values: results.stresses, max: results.maxStress },
        metadata: { units: 'Pa', type: 'von_mises' }
      },
      {
        analysis_id: analysisId,
        result_type: 'reaction_forces',
        data: { values: results.reactions },
        metadata: { units: 'N' }
      },
      {
        analysis_id: analysisId,
        result_type: 'safety_factor',
        data: { value: results.safetyFactor },
        metadata: { type: 'yield_based' }
      }
    ]

    // Insert all results
    const { error: resultsError } = await supabaseClient
      .from('fea_results')
      .insert(resultEntries)

    if (resultsError) {
      console.error('Error storing results:', resultsError)
      
      await supabaseClient
        .from('fea_analyses')
        .update({ status: 'failed' })
        .eq('id', analysisId)
      
      throw resultsError
    }

    // Update analysis status to completed
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    console.log(`FEA analysis completed for ID: ${analysisId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisId, 
        results: {
          maxDisplacement: results.maxDisplacement,
          maxStress: results.maxStress,
          safetyFactor: results.safetyFactor
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('FEA analysis error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
