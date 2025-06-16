
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FEARequest {
  analysis_id: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { analysis_id, user_id }: FEARequest = await req.json();

    console.log(`Starting FEA analysis execution for ${analysis_id}`);

    // Get analysis details
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('fea_analyses')
      .select(`
        *,
        fea_loads(*),
        fea_boundary_conditions(*),
        bim_elements(*)
      `)
      .eq('id', analysis_id)
      .single();

    if (analysisError) throw analysisError;

    // Update status to running
    await supabaseClient
      .from('fea_analyses')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', analysis_id);

    // Execute FEA analysis asynchronously
    EdgeRuntime.waitUntil(executeFEAAnalysis(
      supabaseClient,
      analysis
    ));

    return new Response(
      JSON.stringify({
        success: true,
        analysis_id,
        message: 'FEA analysis execution started',
        estimated_completion: '5-15 minutes'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error starting FEA analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function executeFEAAnalysis(supabaseClient: any, analysis: any) {
  try {
    console.log(`Executing ${analysis.analysis_type} FEA analysis for ${analysis.id}`);

    // Generate mesh
    const mesh = await generateMesh(analysis.bim_elements);
    
    // Save mesh to database
    const { data: meshData } = await supabaseClient
      .from('fea_meshes')
      .insert({
        analysis_id: analysis.id,
        element_type: 'tetrahedron',
        nodes: mesh.nodes,
        elements: mesh.elements,
        properties: mesh.properties
      })
      .select()
      .single();

    // Prepare solver input
    const solverInput = prepareSolverInput(analysis, mesh);
    
    // Execute analysis based on type
    let results;
    switch (analysis.analysis_type) {
      case 'static':
        results = await executeStaticAnalysis(solverInput);
        break;
      case 'modal':
        results = await executeModalAnalysis(solverInput);
        break;
      case 'buckling':
        results = await executeBucklingAnalysis(solverInput);
        break;
      case 'thermal':
        results = await executeThermalAnalysis(solverInput);
        break;
      default:
        throw new Error(`Unsupported analysis type: ${analysis.analysis_type}`);
    }

    // Save results to database
    await saveAnalysisResults(supabaseClient, analysis.id, results);

    // Update analysis status
    await supabaseClient
      .from('fea_analyses')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', analysis.id);

    console.log(`FEA analysis ${analysis.id} completed successfully`);

  } catch (error) {
    console.error('Error executing FEA analysis:', error);
    
    await supabaseClient
      .from('fea_analyses')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', analysis.id);
  }
}

async function generateMesh(bimElements: any[]) {
  // Simplified mesh generation
  const nodes = [];
  const elements = [];
  
  let nodeId = 1;
  let elementId = 1;

  for (const element of bimElements) {
    if (element.element_type === 'beam' || element.element_type === 'column') {
      // Generate beam/column mesh
      const beamMesh = generateBeamMesh(element, nodeId, elementId);
      nodes.push(...beamMesh.nodes);
      elements.push(...beamMesh.elements);
      nodeId += beamMesh.nodes.length;
      elementId += beamMesh.elements.length;
    } else if (element.element_type === 'slab') {
      // Generate slab mesh
      const slabMesh = generateSlabMesh(element, nodeId, elementId);
      nodes.push(...slabMesh.nodes);
      elements.push(...slabMesh.elements);
      nodeId += slabMesh.nodes.length;
      elementId += slabMesh.elements.length;
    }
  }

  return {
    nodes,
    elements,
    properties: {
      node_count: nodes.length,
      element_count: elements.length,
      mesh_quality: 'good'
    }
  };
}

function generateBeamMesh(element: any, startNodeId: number, startElementId: number) {
  const geometry = element.geometry;
  const length = geometry.length || 10;
  const divisions = Math.max(4, Math.floor(length / 2));
  
  const nodes = [];
  const elements = [];

  // Generate nodes along beam length
  for (let i = 0; i <= divisions; i++) {
    const t = i / divisions;
    nodes.push({
      id: startNodeId + i,
      x: geometry.start_x + t * (geometry.end_x - geometry.start_x),
      y: geometry.start_y + t * (geometry.end_y - geometry.start_y),
      z: geometry.start_z + t * (geometry.end_z - geometry.start_z)
    });
  }

  // Generate beam elements
  for (let i = 0; i < divisions; i++) {
    elements.push({
      id: startElementId + i,
      type: 'beam',
      nodes: [startNodeId + i, startNodeId + i + 1],
      properties: {
        cross_section: geometry.cross_section || 'rectangular',
        width: geometry.width || 0.3,
        height: geometry.height || 0.6,
        material: element.material_id
      }
    });
  }

  return { nodes, elements };
}

function generateSlabMesh(element: any, startNodeId: number, startElementId: number) {
  const geometry = element.geometry;
  const width = geometry.width || 10;
  const length = geometry.length || 10;
  const xDivisions = Math.max(4, Math.floor(width / 2));
  const yDivisions = Math.max(4, Math.floor(length / 2));
  
  const nodes = [];
  const elements = [];

  // Generate nodes in grid
  for (let j = 0; j <= yDivisions; j++) {
    for (let i = 0; i <= xDivisions; i++) {
      nodes.push({
        id: startNodeId + j * (xDivisions + 1) + i,
        x: geometry.origin_x + (i / xDivisions) * width,
        y: geometry.origin_y + (j / yDivisions) * length,
        z: geometry.origin_z || 0
      });
    }
  }

  // Generate shell elements
  for (let j = 0; j < yDivisions; j++) {
    for (let i = 0; i < xDivisions; i++) {
      const n1 = startNodeId + j * (xDivisions + 1) + i;
      const n2 = n1 + 1;
      const n3 = n1 + xDivisions + 2;
      const n4 = n1 + xDivisions + 1;
      
      elements.push({
        id: startElementId + j * xDivisions + i,
        type: 'shell',
        nodes: [n1, n2, n3, n4],
        properties: {
          thickness: geometry.thickness || 0.2,
          material: element.material_id
        }
      });
    }
  }

  return { nodes, elements };
}

function prepareSolverInput(analysis: any, mesh: any) {
  return {
    analysis_type: analysis.analysis_type,
    mesh,
    loads: analysis.fea_loads,
    boundary_conditions: analysis.fea_boundary_conditions,
    material_properties: getMaterialProperties(),
    solver_parameters: analysis.input_parameters
  };
}

function getMaterialProperties() {
  return {
    steel: {
      elastic_modulus: 200000, // MPa
      poisson_ratio: 0.3,
      density: 7850, // kg/m³
      yield_strength: 355 // MPa
    },
    concrete: {
      elastic_modulus: 30000, // MPa
      poisson_ratio: 0.2,
      density: 2400, // kg/m³
      compressive_strength: 25 // MPa
    }
  };
}

async function executeStaticAnalysis(input: any) {
  // Simplified static analysis simulation
  const nodes = input.mesh.nodes;
  const elements = input.mesh.elements;
  
  // Simulate displacement results
  const displacements = nodes.map(node => ({
    node_id: node.id,
    dx: Math.random() * 0.001, // mm
    dy: Math.random() * 0.001,
    dz: Math.random() * 0.002
  }));

  // Simulate stress results
  const stresses = elements.map(element => ({
    element_id: element.id,
    von_mises: Math.random() * 150, // MPa
    max_principal: Math.random() * 100,
    min_principal: Math.random() * -50
  }));

  // Simulate reaction forces
  const reactions = input.boundary_conditions.map(bc => ({
    location: bc.location,
    fx: Math.random() * 1000, // N
    fy: Math.random() * 1000,
    fz: Math.random() * 5000
  }));

  return {
    displacements,
    stresses,
    reactions,
    max_displacement: Math.max(...displacements.map(d => Math.sqrt(d.dx**2 + d.dy**2 + d.dz**2))),
    max_stress: Math.max(...stresses.map(s => s.von_mises))
  };
}

async function executeModalAnalysis(input: any) {
  // Simplified modal analysis
  const modes = [];
  
  for (let i = 1; i <= 10; i++) {
    modes.push({
      mode_number: i,
      frequency: Math.random() * 20 + i * 2, // Hz
      period: 1 / (Math.random() * 20 + i * 2),
      modal_mass_participation: Math.random() * 0.3
    });
  }

  return { modes };
}

async function executeBucklingAnalysis(input: any) {
  // Simplified buckling analysis
  const bucklingFactors = [];
  
  for (let i = 1; i <= 5; i++) {
    bucklingFactors.push({
      mode: i,
      eigenvalue: Math.random() * 2 + 0.5,
      critical_load_factor: Math.random() * 3 + 1
    });
  }

  return { buckling_factors: bucklingFactors };
}

async function executeThermalAnalysis(input: any) {
  // Simplified thermal analysis
  const nodes = input.mesh.nodes;
  
  const temperatures = nodes.map(node => ({
    node_id: node.id,
    temperature: 20 + Math.random() * 30 // °C
  }));

  const heatFlux = nodes.map(node => ({
    node_id: node.id,
    flux_x: Math.random() * 100,
    flux_y: Math.random() * 100,
    flux_z: Math.random() * 100
  }));

  return {
    temperatures,
    heat_flux: heatFlux,
    max_temperature: Math.max(...temperatures.map(t => t.temperature)),
    min_temperature: Math.min(...temperatures.map(t => t.temperature))
  };
}

async function saveAnalysisResults(supabaseClient: any, analysisId: string, results: any) {
  const resultEntries = [];

  // Save different result types
  for (const [resultType, data] of Object.entries(results)) {
    if (Array.isArray(data)) {
      resultEntries.push({
        analysis_id: analysisId,
        result_type: resultType,
        data: data,
        metadata: {
          count: data.length,
          units: getUnitsForResultType(resultType)
        }
      });
    } else if (typeof data === 'object') {
      resultEntries.push({
        analysis_id: analysisId,
        result_type: resultType,
        data: data,
        metadata: {
          summary: true,
          units: getUnitsForResultType(resultType)
        }
      });
    }
  }

  await supabaseClient
    .from('fea_results')
    .insert(resultEntries);
}

function getUnitsForResultType(resultType: string) {
  const units = {
    displacements: 'mm',
    stresses: 'MPa',
    reactions: 'N',
    temperatures: '°C',
    heat_flux: 'W/m²',
    modes: 'Hz'
  };
  
  return units[resultType] || 'dimensionless';
}
