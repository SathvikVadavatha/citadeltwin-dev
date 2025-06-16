
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FEARequest {
  action: string;
  analysisId: string;
  analysisType?: 'static' | 'modal' | 'buckling' | 'dynamic' | 'thermal' | 'nonlinear';
  materialModel?: 'linear' | 'nonlinear' | 'composite' | 'thermal';
  complexLoading?: any;
  solverSettings?: any;
  timeIntegration?: any;
  nonlinearSettings?: any;
  coupling?: any;
  postProcessing?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: FEARequest = await req.json();
    console.log('Advanced FEA integration request:', requestData);

    switch (requestData.action) {
      case 'run_dynamic_analysis':
        return await handleDynamicAnalysis(requestData);
      
      case 'run_nonlinear_analysis':
        return await handleNonlinearAnalysis(requestData);
      
      case 'run_thermal_structural':
        return await handleThermalStructuralAnalysis(requestData);
      
      case 'process_advanced_results':
        return await handleAdvancedResultsProcessing(requestData);
      
      default:
        throw new Error(`Unknown FEA action: ${requestData.action}`);
    }

  } catch (error) {
    console.error('Advanced FEA integration error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process advanced FEA request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleDynamicAnalysis(request: FEARequest) {
  const { analysisId, timeIntegration } = request;
  
  console.log(`Running dynamic analysis for: ${analysisId}`);
  
  // Get analysis data
  const { data: analysis, error: analysisError } = await supabase
    .from('fea_analyses')
    .select(`
      *,
      fea_loads (*),
      fea_boundary_conditions (*),
      fea_meshes (*)
    `)
    .eq('id', analysisId)
    .single();
    
  if (analysisError) throw analysisError;
  
  // Update analysis status
  await supabase
    .from('fea_analyses')
    .update({ 
      status: 'running',
      started_at: new Date().toISOString()
    })
    .eq('id', analysisId);
  
  // Simulate CalculiX dynamic analysis
  const dynamicResults = await simulateCalculiXDynamic(analysis, timeIntegration);
  
  // Store results
  const { data: results, error: resultsError } = await supabase
    .from('fea_results')
    .insert([
      {
        analysis_id: analysisId,
        result_type: 'dynamic_displacement',
        data: dynamicResults.displacement,
        metadata: {
          analysis_type: 'dynamic',
          time_steps: dynamicResults.timeSteps,
          max_displacement: dynamicResults.maxDisplacement,
          natural_frequencies: dynamicResults.naturalFrequencies
        }
      },
      {
        analysis_id: analysisId,
        result_type: 'dynamic_stress',
        data: dynamicResults.stress,
        metadata: {
          analysis_type: 'dynamic',
          max_stress: dynamicResults.maxStress,
          stress_distribution: dynamicResults.stressDistribution
        }
      }
    ])
    .select();
    
  if (resultsError) throw resultsError;
  
  // Update analysis completion
  await supabase
    .from('fea_analyses')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', analysisId);
  
  return new Response(
    JSON.stringify({
      success: true,
      analysisId,
      analysis_type: 'dynamic',
      results: dynamicResults,
      natural_frequencies: dynamicResults.naturalFrequencies,
      max_displacement: dynamicResults.maxDisplacement,
      processing_time: dynamicResults.processingTime
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleNonlinearAnalysis(request: FEARequest) {
  const { analysisId, nonlinearSettings } = request;
  
  console.log(`Running nonlinear analysis for: ${analysisId}`);
  
  // Get analysis data
  const { data: analysis, error: analysisError } = await supabase
    .from('fea_analyses')
    .select('*')
    .eq('id', analysisId)
    .single();
    
  if (analysisError) throw analysisError;
  
  // Update analysis status
  await supabase
    .from('fea_analyses')
    .update({ 
      status: 'running',
      started_at: new Date().toISOString()
    })
    .eq('id', analysisId);
  
  // Simulate CalculiX nonlinear analysis
  const nonlinearResults = await simulateCalculiXNonlinear(analysis, nonlinearSettings);
  
  // Store results
  const { data: results, error: resultsError } = await supabase
    .from('fea_results')
    .insert([
      {
        analysis_id: analysisId,
        result_type: 'nonlinear_displacement',
        data: nonlinearResults.displacement,
        metadata: {
          analysis_type: 'nonlinear',
          load_steps: nonlinearResults.loadSteps,
          convergence_info: nonlinearResults.convergence,
          material_nonlinearity: nonlinearResults.materialNonlinearity
        }
      },
      {
        analysis_id: analysisId,
        result_type: 'nonlinear_stress',
        data: nonlinearResults.stress,
        metadata: {
          analysis_type: 'nonlinear',
          plastic_strain: nonlinearResults.plasticStrain,
          yield_regions: nonlinearResults.yieldRegions
        }
      }
    ])
    .select();
    
  if (resultsError) throw resultsError;
  
  // Update analysis completion
  await supabase
    .from('fea_analyses')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', analysisId);
  
  return new Response(
    JSON.stringify({
      success: true,
      analysisId,
      analysis_type: 'nonlinear',
      results: nonlinearResults,
      convergence_achieved: nonlinearResults.convergence.achieved,
      load_steps_completed: nonlinearResults.loadSteps,
      processing_time: nonlinearResults.processingTime
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleThermalStructuralAnalysis(request: FEARequest) {
  const { analysisId, coupling } = request;
  
  console.log(`Running thermal-structural analysis for: ${analysisId}`);
  
  // Get analysis data
  const { data: analysis, error: analysisError } = await supabase
    .from('fea_analyses')
    .select('*')
    .eq('id', analysisId)
    .single();
    
  if (analysisError) throw analysisError;
  
  // Update analysis status
  await supabase
    .from('fea_analyses')
    .update({ 
      status: 'running',
      started_at: new Date().toISOString()
    })
    .eq('id', analysisId);
  
  // Simulate CalculiX thermal-structural coupling
  const thermalResults = await simulateCalculiXThermalStructural(analysis, coupling);
  
  // Store results
  const { data: results, error: resultsError } = await supabase
    .from('fea_results')
    .insert([
      {
        analysis_id: analysisId,
        result_type: 'thermal_temperature',
        data: thermalResults.temperature,
        metadata: {
          analysis_type: 'thermal_structural',
          max_temperature: thermalResults.maxTemperature,
          thermal_gradients: thermalResults.thermalGradients
        }
      },
      {
        analysis_id: analysisId,
        result_type: 'thermal_stress',
        data: thermalResults.thermalStress,
        metadata: {
          analysis_type: 'thermal_structural',
          thermal_expansion: thermalResults.thermalExpansion,
          coupled_displacement: thermalResults.displacement
        }
      }
    ])
    .select();
    
  if (resultsError) throw resultsError;
  
  // Update analysis completion
  await supabase
    .from('fea_analyses')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', analysisId);
  
  return new Response(
    JSON.stringify({
      success: true,
      analysisId,
      analysis_type: 'thermal_structural',
      results: thermalResults,
      max_temperature: thermalResults.maxTemperature,
      max_thermal_stress: thermalResults.maxThermalStress,
      processing_time: thermalResults.processingTime
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleAdvancedResultsProcessing(request: FEARequest) {
  const { analysisId, postProcessing } = request;
  
  console.log(`Processing advanced results for: ${analysisId}`);
  
  // Get existing results
  const { data: results, error: resultsError } = await supabase
    .from('fea_results')
    .select('*')
    .eq('analysis_id', analysisId);
    
  if (resultsError) throw resultsError;
  
  // Process advanced visualizations and calculations
  const processedResults = await processAdvancedResults(results, postProcessing);
  
  // Store processed results
  const { data: newResults, error: storeError } = await supabase
    .from('fea_results')
    .insert([
      {
        analysis_id: analysisId,
        result_type: 'contour_plots',
        data: processedResults.contours,
        metadata: {
          post_processing: true,
          contour_levels: processedResults.contourLevels,
          color_maps: processedResults.colorMaps
        }
      },
      {
        analysis_id: analysisId,
        result_type: 'vector_plots',
        data: processedResults.vectors,
        metadata: {
          post_processing: true,
          vector_scale: processedResults.vectorScale,
          vector_density: processedResults.vectorDensity
        }
      },
      {
        analysis_id: analysisId,
        result_type: 'safety_factors',
        data: processedResults.safetyFactors,
        metadata: {
          post_processing: true,
          minimum_safety_factor: processedResults.minSafetyFactor,
          critical_locations: processedResults.criticalLocations
        }
      }
    ])
    .select();
    
  if (storeError) throw storeError;
  
  return new Response(
    JSON.stringify({
      success: true,
      analysisId,
      processed_results: processedResults,
      contour_levels: processedResults.contourLevels,
      safety_factors: processedResults.safetyFactors,
      critical_locations: processedResults.criticalLocations
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// CalculiX simulation functions
async function simulateCalculiXDynamic(analysis: any, timeIntegration: any) {
  console.log('Simulating CalculiX dynamic analysis...');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const timeSteps = 100;
  const naturalFrequencies = [12.5, 18.7, 24.3, 31.6, 42.8];
  
  return {
    displacement: generateTimeSeriesData(timeSteps, 'displacement'),
    stress: generateTimeSeriesData(timeSteps, 'stress'),
    timeSteps,
    naturalFrequencies,
    maxDisplacement: Math.random() * 10 + 5,
    maxStress: Math.random() * 200 + 100,
    stressDistribution: generateStressDistribution(),
    processingTime: 2000 + Math.random() * 1000
  };
}

async function simulateCalculiXNonlinear(analysis: any, settings: any) {
  console.log('Simulating CalculiX nonlinear analysis...');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const loadSteps = settings?.loadSteps || 10;
  
  return {
    displacement: generateLoadStepData(loadSteps, 'displacement'),
    stress: generateLoadStepData(loadSteps, 'stress'),
    loadSteps,
    convergence: {
      achieved: true,
      iterations: Math.floor(Math.random() * 20) + 5,
      tolerance: 1e-6
    },
    materialNonlinearity: {
      plastic_regions: Math.floor(Math.random() * 10),
      yield_stress: 250 + Math.random() * 50
    },
    plasticStrain: generatePlasticStrainData(),
    yieldRegions: generateYieldRegions(),
    processingTime: 3000 + Math.random() * 2000
  };
}

async function simulateCalculiXThermalStructural(analysis: any, coupling: any) {
  console.log('Simulating CalculiX thermal-structural analysis...');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  return {
    temperature: generateTemperatureField(),
    thermalStress: generateThermalStressField(),
    displacement: generateThermalDisplacementField(),
    maxTemperature: 150 + Math.random() * 50,
    maxThermalStress: 80 + Math.random() * 40,
    thermalGradients: generateThermalGradients(),
    thermalExpansion: generateThermalExpansion(),
    processingTime: 4000 + Math.random() * 2000
  };
}

async function processAdvancedResults(results: any[], postProcessing: any) {
  console.log('Processing advanced FEA results...');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    contours: generateContourData(),
    vectors: generateVectorData(),
    safetyFactors: generateSafetyFactors(),
    contourLevels: 20,
    colorMaps: ['rainbow', 'heat', 'cool'],
    vectorScale: 1.0,
    vectorDensity: 0.5,
    minSafetyFactor: 1.5 + Math.random() * 2,
    criticalLocations: generateCriticalLocations()
  };
}

// Helper functions for generating mock FEA data
function generateTimeSeriesData(steps: number, type: string) {
  return Array.from({ length: steps }, (_, i) => ({
    time: i * 0.01,
    value: Math.sin(i * 0.1) * (type === 'displacement' ? 5 : 100) + Math.random() * 2
  }));
}

function generateLoadStepData(steps: number, type: string) {
  return Array.from({ length: steps }, (_, i) => ({
    load_factor: (i + 1) / steps,
    value: Math.pow((i + 1) / steps, 1.5) * (type === 'displacement' ? 10 : 200)
  }));
}

function generateStressDistribution() {
  return {
    von_mises: Array.from({ length: 100 }, () => Math.random() * 200 + 50),
    principal_1: Array.from({ length: 100 }, () => Math.random() * 150 + 25),
    principal_2: Array.from({ length: 100 }, () => Math.random() * 100),
    shear_max: Array.from({ length: 100 }, () => Math.random() * 80 + 10)
  };
}

function generatePlasticStrainData() {
  return Array.from({ length: 50 }, (_, i) => ({
    element_id: i + 1,
    plastic_strain: Math.random() * 0.01,
    equivalent_stress: Math.random() * 300 + 200
  }));
}

function generateYieldRegions() {
  return Array.from({ length: 10 }, (_, i) => ({
    region_id: i + 1,
    elements: Math.floor(Math.random() * 20) + 5,
    yield_percentage: Math.random() * 100
  }));
}

function generateTemperatureField() {
  return Array.from({ length: 100 }, (_, i) => ({
    node_id: i + 1,
    temperature: 20 + Math.random() * 180,
    x: Math.random() * 10,
    y: Math.random() * 10,
    z: Math.random() * 10
  }));
}

function generateThermalStressField() {
  return Array.from({ length: 100 }, (_, i) => ({
    element_id: i + 1,
    thermal_stress: Math.random() * 120 + 20,
    x: Math.random() * 10,
    y: Math.random() * 10,
    z: Math.random() * 10
  }));
}

function generateThermalDisplacementField() {
  return Array.from({ length: 100 }, (_, i) => ({
    node_id: i + 1,
    displacement_x: (Math.random() - 0.5) * 2,
    displacement_y: (Math.random() - 0.5) * 2,
    displacement_z: (Math.random() - 0.5) * 2
  }));
}

function generateThermalGradients() {
  return Array.from({ length: 20 }, (_, i) => ({
    location_id: i + 1,
    gradient_magnitude: Math.random() * 50 + 10,
    direction: {
      x: Math.random() - 0.5,
      y: Math.random() - 0.5,
      z: Math.random() - 0.5
    }
  }));
}

function generateThermalExpansion() {
  return {
    coefficient: 12e-6,
    total_expansion: Math.random() * 5 + 2,
    expansion_directions: ['x', 'y', 'z'],
    constrained_expansion: Math.random() * 3 + 1
  };
}

function generateContourData() {
  return Array.from({ length: 1000 }, (_, i) => ({
    node_id: i + 1,
    value: Math.random() * 200 + 50,
    x: Math.random() * 10,
    y: Math.random() * 10,
    z: Math.random() * 10
  }));
}

function generateVectorData() {
  return Array.from({ length: 200 }, (_, i) => ({
    node_id: i + 1,
    magnitude: Math.random() * 10 + 1,
    direction: {
      x: Math.random() - 0.5,
      y: Math.random() - 0.5,
      z: Math.random() - 0.5
    },
    position: {
      x: Math.random() * 10,
      y: Math.random() * 10,
      z: Math.random() * 10
    }
  }));
}

function generateSafetyFactors() {
  return Array.from({ length: 100 }, (_, i) => ({
    element_id: i + 1,
    safety_factor: 1.2 + Math.random() * 4,
    failure_mode: ['yielding', 'buckling', 'fatigue'][Math.floor(Math.random() * 3)],
    critical: Math.random() < 0.1
  }));
}

function generateCriticalLocations() {
  return Array.from({ length: 5 }, (_, i) => ({
    location_id: i + 1,
    element_id: Math.floor(Math.random() * 100) + 1,
    safety_factor: 1.1 + Math.random() * 0.4,
    stress_level: Math.random() * 300 + 200,
    coordinates: {
      x: Math.random() * 10,
      y: Math.random() * 10,
      z: Math.random() * 10
    }
  }));
}
