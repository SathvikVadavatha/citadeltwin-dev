
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

// Enhanced FEA calculations for comprehensive structural analysis
class AdvancedFEASolver {
  
  // Material property defaults
  private getMaterialProperties(material: any) {
    const defaults = {
      steel: {
        elastic_modulus: 200e9, // Pa
        yield_strength: 250e6, // Pa
        density: 7850, // kg/m³
        poisson_ratio: 0.3,
        thermal_expansion: 12e-6, // 1/K
        shear_modulus: 80e9 // Pa
      },
      concrete: {
        elastic_modulus: 30e9, // Pa
        yield_strength: 30e6, // Pa (compressive)
        density: 2400, // kg/m³
        poisson_ratio: 0.2,
        thermal_expansion: 10e-6, // 1/K
        shear_modulus: 12.5e9 // Pa
      },
      wood: {
        elastic_modulus: 12e9, // Pa
        yield_strength: 40e6, // Pa
        density: 600, // kg/m³
        poisson_ratio: 0.4,
        thermal_expansion: 5e-6, // 1/K
        shear_modulus: 0.75e9 // Pa
      }
    };

    const materialType = material?.material_type?.toLowerCase() || 'steel';
    const baseProps = defaults[materialType as keyof typeof defaults] || defaults.steel;
    
    return {
      ...baseProps,
      ...material?.properties // Override with custom properties
    };
  }

  // Enhanced beam deflection calculation with multiple load cases
  calculateBeamDeflection(geometry: any, loads: any[], materialProps: any): any {
    const length = geometry.dimensions?.length || geometry.length || 1;
    const width = geometry.dimensions?.width || geometry.width || 0.1;
    const height = geometry.dimensions?.height || geometry.height || 0.1;
    
    const E = materialProps.elastic_modulus;
    const I = (width * Math.pow(height, 3)) / 12; // Moment of inertia
    
    let maxDeflection = 0;
    const deflections = [];

    loads.forEach((load, index) => {
      let deflection = 0;
      
      switch (load.load_type) {
        case 'point_load':
          // δ = PL³/(48EI) for simply supported beam with point load at center
          deflection = (load.magnitude * Math.pow(length, 3)) / (48 * E * I);
          break;
        
        case 'distributed_load':
          // δ = 5wL⁴/(384EI) for uniformly distributed load
          deflection = (5 * load.magnitude * Math.pow(length, 4)) / (384 * E * I);
          break;
        
        case 'gravity':
          const weight = materialProps.density * (width * height * length) * 9.81;
          deflection = (5 * weight * Math.pow(length, 4)) / (384 * E * I);
          break;
          
        case 'wind_load':
          // Treat as distributed load
          deflection = (5 * load.magnitude * Math.pow(length, 4)) / (384 * E * I);
          break;
          
        case 'seismic_load':
          // Simplified seismic analysis
          const seismicForce = materialProps.density * (width * height * length) * load.magnitude;
          deflection = (seismicForce * Math.pow(length, 3)) / (48 * E * I);
          break;
      }

      deflections.push({
        loadIndex: index,
        loadType: load.load_type,
        value: deflection,
        location: load.location || { x: length/2, y: 0, z: 0 },
        direction: 'y'
      });

      maxDeflection = Math.max(maxDeflection, Math.abs(deflection));
    });

    return { deflections, maxDeflection };
  }

  // Enhanced stress calculation with von Mises stress
  calculateStresses(geometry: any, loads: any[], materialProps: any): any {
    const length = geometry.dimensions?.length || geometry.length || 1;
    const width = geometry.dimensions?.width || geometry.width || 0.1;
    const height = geometry.dimensions?.height || geometry.height || 0.1;
    
    const I = (width * Math.pow(height, 3)) / 12;
    const A = width * height;
    const yMax = height / 2;
    
    let maxStress = 0;
    const stresses = [];

    loads.forEach((load, index) => {
      let bendingStress = 0;
      let shearStress = 0;
      let axialStress = 0;
      
      switch (load.load_type) {
        case 'point_load':
          const moment = (load.magnitude * length) / 4; // Max moment for simply supported
          bendingStress = (moment * yMax) / I;
          shearStress = (load.magnitude) / (2 * A); // Max shear
          break;
        
        case 'distributed_load':
          const maxMoment = (load.magnitude * Math.pow(length, 2)) / 8;
          bendingStress = (maxMoment * yMax) / I;
          shearStress = (load.magnitude * length) / (2 * A);
          break;
          
        case 'axial_load':
          axialStress = load.magnitude / A;
          break;
      }

      // Calculate von Mises stress (simplified 2D case)
      const vonMisesStress = Math.sqrt(
        Math.pow(bendingStress + axialStress, 2) + 
        3 * Math.pow(shearStress, 2)
      );

      stresses.push({
        loadIndex: index,
        loadType: load.load_type,
        bending: bendingStress,
        shear: shearStress,
        axial: axialStress,
        vonMises: vonMisesStress,
        location: load.location || { x: length/2, y: 0, z: 0 }
      });

      maxStress = Math.max(maxStress, vonMisesStress);
    });

    return { stresses, maxStress };
  }

  // Buckling analysis for columns
  calculateBuckling(geometry: any, loads: any[], materialProps: any): any {
    const length = geometry.dimensions?.length || geometry.length || 1;
    const width = geometry.dimensions?.width || geometry.width || 0.1;
    const height = geometry.dimensions?.height || geometry.height || 0.1;
    
    const E = materialProps.elastic_modulus;
    const I = Math.min(
      (width * Math.pow(height, 3)) / 12,
      (height * Math.pow(width, 3)) / 12
    ); // Use minimum moment of inertia
    
    // Euler buckling load: Pcr = π²EI/(KL)²
    const K = 1.0; // End condition factor (pinned-pinned)
    const eulerLoad = (Math.PI * Math.PI * E * I) / Math.pow(K * length, 2);
    
    // Check for buckling in axial loads
    const axialLoads = loads.filter(load => load.load_type === 'axial_load');
    const totalAxialLoad = axialLoads.reduce((sum, load) => sum + load.magnitude, 0);
    
    const bucklingRatio = totalAxialLoad / eulerLoad;
    const isBuckling = bucklingRatio > 1.0;
    
    return {
      eulerLoad,
      appliedLoad: totalAxialLoad,
      bucklingRatio,
      isBuckling,
      safetyFactor: isBuckling ? bucklingRatio : eulerLoad / Math.max(totalAxialLoad, 1)
    };
  }

  // Main analysis method
  performAdvancedAnalysis(geometry: any, material: any, loads: any[], boundaryConditions: any[]): any {
    const materialProps = this.getMaterialProperties(material);
    
    // Perform deflection analysis
    const deflectionResults = this.calculateBeamDeflection(geometry, loads, materialProps);
    
    // Perform stress analysis
    const stressResults = this.calculateStresses(geometry, loads, materialProps);
    
    // Perform buckling analysis
    const bucklingResults = this.calculateBuckling(geometry, loads, materialProps);
    
    // Calculate overall safety factors
    const stressSafetyFactor = stressResults.maxStress > 0 ? 
      materialProps.yield_strength / stressResults.maxStress : 999;
    
    // Calculate reactions
    const totalLoad = loads.reduce((sum, load) => {
      if (load.load_type === 'point_load' || load.load_type === 'distributed_load') {
        return sum + load.magnitude;
      }
      return sum;
    }, 0);
    
    const reactions = boundaryConditions.map((bc, index) => ({
      conditionIndex: index,
      force: totalLoad / Math.max(boundaryConditions.length, 1),
      location: bc.location,
      type: bc.condition_type
    }));

    return {
      deflections: deflectionResults.deflections,
      stresses: stressResults.stresses,
      reactions,
      buckling: bucklingResults,
      summary: {
        maxDeflection: deflectionResults.maxDeflection,
        maxStress: stressResults.maxStress,
        stressSafetyFactor,
        bucklingRatio: bucklingResults.bucklingRatio,
        overallStatus: stressSafetyFactor > 2.0 && !bucklingResults.isBuckling ? 'SAFE' : 'REVIEW_REQUIRED'
      },
      materialProperties: materialProps
    };
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

    console.log(`Starting enhanced FEA analysis for ID: ${analysisId}`)

    // Update analysis status to running
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    // Initialize enhanced FEA solver
    const solver = new AdvancedFEASolver()

    // Perform the comprehensive analysis
    const results = solver.performAdvancedAnalysis(geometry, material, loads, boundaryConditions)

    // Store detailed results in database
    const resultEntries = [
      {
        analysis_id: analysisId,
        result_type: 'displacement',
        data: { 
          values: results.deflections, 
          max: results.summary.maxDeflection,
          units: 'm'
        },
        metadata: { coordinate_system: 'global', analysis_type: 'linear_static' }
      },
      {
        analysis_id: analysisId,
        result_type: 'stress',
        data: { 
          values: results.stresses, 
          max: results.summary.maxStress,
          units: 'Pa'
        },
        metadata: { stress_type: 'von_mises', yield_strength: results.materialProperties.yield_strength }
      },
      {
        analysis_id: analysisId,
        result_type: 'reaction_forces',
        data: { values: results.reactions, units: 'N' },
        metadata: { boundary_conditions: boundaryConditions.length }
      },
      {
        analysis_id: analysisId,
        result_type: 'safety_analysis',
        data: {
          stress_safety_factor: results.summary.stressSafetyFactor,
          buckling_ratio: results.summary.bucklingRatio,
          overall_status: results.summary.overallStatus
        },
        metadata: { material_type: material?.material_type || 'steel' }
      },
      {
        analysis_id: analysisId,
        result_type: 'buckling_analysis',
        data: results.buckling,
        metadata: { analysis_method: 'euler_buckling' }
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
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString()
        })
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

    console.log(`Enhanced FEA analysis completed for ID: ${analysisId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisId, 
        results: results.summary
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
