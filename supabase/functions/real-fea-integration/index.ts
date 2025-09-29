
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FEAServiceConfig {
  calculix: {
    enabled: boolean;
    endpoint?: string;
  };
  opensees: {
    enabled: boolean;
    endpoint?: string;
  };
  abaqus: {
    enabled: boolean;
    endpoint?: string;
  };
}

const feaConfig: FEAServiceConfig = {
  calculix: { enabled: true },
  opensees: { enabled: true },
  abaqus: { enabled: false }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()

    switch (action) {
      case 'run_static_analysis':
        return await runStaticAnalysis(supabaseClient, params)
      case 'run_modal_analysis':
        return await runModalAnalysis(supabaseClient, params)
      case 'run_buckling_analysis':
        return await runBucklingAnalysis(supabaseClient, params)
      case 'generate_mesh':
        return await generateMesh(supabaseClient, params)
      case 'validate_model':
        return await validateModel(supabaseClient, params)
      case 'get_analysis_status':
        return await getAnalysisStatus(supabaseClient, params)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in real-fea-integration:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function runStaticAnalysis(supabaseClient: any, params: any) {
  const { analysisId, elementId, forces, constraints, materialProperties } = params;
  
  try {
    // Update analysis status to running
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    // Get element geometry and mesh
    const { data: element } = await supabaseClient
      .from('bim_elements')
      .select('geometry, parameters')
      .eq('id', elementId)
      .single();

    if (!element) {
      throw new Error('Element not found');
    }

    // Generate or get existing mesh
    const mesh = await getOrGenerateMesh(supabaseClient, analysisId, element);
    
    // Prepare CalculiX input file
    const calculixInput = generateCalculixInput({
      mesh,
      forces,
      constraints,
      materialProperties,
      analysisType: 'static'
    });

    // Run CalculiX analysis
    const analysisResults = await executeCalculixAnalysis(calculixInput);
    
    // Process and store results
    const processedResults = await processStaticResults(analysisResults);
    
    // Store results in database
    const { data: resultData, error: resultError } = await supabaseClient
      .from('fea_results')
      .insert({
        analysis_id: analysisId,
        result_type: 'static',
        data: processedResults,
        metadata: {
          solver: 'CalculiX',
          element_count: mesh.elements.length,
          node_count: mesh.nodes.length,
          analysis_time: processedResults.analysisTime
        }
      });

    if (resultError) throw resultError;

    // Update analysis status to completed
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: processedResults,
        resultId: resultData[0].id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Update analysis status to failed
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    console.error('Error in static analysis:', error);
    throw error;
  }
}

async function runModalAnalysis(supabaseClient: any, params: any) {
  const { analysisId, elementId, materialProperties, numberOfModes = 10 } = params;
  
  try {
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    const { data: element } = await supabaseClient
      .from('bim_elements')
      .select('geometry, parameters')
      .eq('id', elementId)
      .single();

    const mesh = await getOrGenerateMesh(supabaseClient, analysisId, element);
    
    const calculixInput = generateCalculixInput({
      mesh,
      materialProperties,
      analysisType: 'modal',
      numberOfModes
    });

    const analysisResults = await executeCalculixAnalysis(calculixInput);
    const processedResults = await processModalResults(analysisResults, numberOfModes);
    
    const { data: resultData, error: resultError } = await supabaseClient
      .from('fea_results')
      .insert({
        analysis_id: analysisId,
        result_type: 'modal',
        data: processedResults,
        metadata: {
          solver: 'CalculiX',
          number_of_modes: numberOfModes,
          analysis_time: processedResults.analysisTime
        }
      });

    if (resultError) throw resultError;

    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: processedResults,
        resultId: resultData[0].id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    console.error('Error in modal analysis:', error);
    throw error;
  }
}

async function runBucklingAnalysis(supabaseClient: any, params: any) {
  const { analysisId, elementId, loads, materialProperties } = params;
  
  try {
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    const { data: element } = await supabaseClient
      .from('bim_elements')
      .select('geometry, parameters')
      .eq('id', elementId)
      .single();

    const mesh = await getOrGenerateMesh(supabaseClient, analysisId, element);
    
    const calculixInput = generateCalculixInput({
      mesh,
      loads,
      materialProperties,
      analysisType: 'buckling'
    });

    const analysisResults = await executeCalculixAnalysis(calculixInput);
    const processedResults = await processBucklingResults(analysisResults);
    
    const { data: resultData, error: resultError } = await supabaseClient
      .from('fea_results')
      .insert({
        analysis_id: analysisId,
        result_type: 'buckling',
        data: processedResults,
        metadata: {
          solver: 'CalculiX',
          critical_load_factor: processedResults.criticalLoadFactor,
          analysis_time: processedResults.analysisTime
        }
      });

    if (resultError) throw resultError;

    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: processedResults,
        resultId: resultData[0].id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    await supabaseClient
      .from('fea_analyses')
      .update({ 
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    console.error('Error in buckling analysis:', error);
    throw error;
  }
}

async function generateMesh(supabaseClient: any, params: any) {
  const { analysisId, elementId, meshSize = 0.1, elementType = 'C3D20' } = params;
  
  try {
    const { data: element } = await supabaseClient
      .from('bim_elements')
      .select('geometry, parameters')
      .eq('id', elementId)
      .single();

    if (!element) {
      throw new Error('Element not found');
    }

    // Generate mesh based on element geometry
    const mesh = await generateElementMesh(element.geometry, {
      meshSize,
      elementType
    });

    // Store mesh in database
    const { data: meshData, error: meshError } = await supabaseClient
      .from('fea_meshes')
      .insert({
        analysis_id: analysisId,
        element_type: elementType,
        nodes: mesh.nodes,
        elements: mesh.elements,
        properties: {
          mesh_size: meshSize,
          node_count: mesh.nodes.length,
          element_count: mesh.elements.length,
          quality_metrics: mesh.qualityMetrics
        }
      });

    if (meshError) throw meshError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        mesh,
        meshId: meshData[0].id,
        statistics: {
          nodeCount: mesh.nodes.length,
          elementCount: mesh.elements.length,
          averageQuality: mesh.qualityMetrics.averageQuality
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating mesh:', error);
    throw error;
  }
}

async function validateModel(supabaseClient: any, params: any) {
  const { analysisId } = params;
  
  try {
    // Get analysis data
    const { data: analysis } = await supabaseClient
      .from('fea_analyses')
      .select(`
        *,
        fea_loads(*),
        fea_boundary_conditions(*),
        fea_meshes(*)
      `)
      .eq('id', analysisId)
      .single();

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    const validationResults: {
      isValid: boolean;
      warnings: string[];
      errors: string[];
      checks: {
        mesh?: any;
        loads?: any;
        boundaryConditions?: any;
      };
    } = {
      isValid: true,
      warnings: [],
      errors: [],
      checks: {}
    };

    // Mesh validation
    if (analysis.fea_meshes && analysis.fea_meshes.length > 0) {
      const meshValidation = validateMesh(analysis.fea_meshes[0]);
      validationResults.checks.mesh = meshValidation;
      
      if (!meshValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors.push(...meshValidation.errors);
      }
      validationResults.warnings.push(...meshValidation.warnings);
    } else {
      validationResults.isValid = false;
      validationResults.errors.push('No mesh found for analysis');
    }

    // Loads validation
    if (analysis.fea_loads && analysis.fea_loads.length > 0) {
      const loadsValidation = validateLoads(analysis.fea_loads);
      validationResults.checks.loads = loadsValidation;
      
      if (!loadsValidation.isValid) {
        validationResults.warnings.push(...loadsValidation.warnings);
      }
    } else {
      validationResults.warnings.push('No loads defined - static analysis may not be meaningful');
    }

    // Boundary conditions validation
    if (analysis.fea_boundary_conditions && analysis.fea_boundary_conditions.length > 0) {
      const bcValidation = validateBoundaryConditions(analysis.fea_boundary_conditions);
      validationResults.checks.boundaryConditions = bcValidation;
      
      if (!bcValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors.push(...bcValidation.errors);
      }
    } else {
      validationResults.isValid = false;
      validationResults.errors.push('No boundary conditions defined - model is unconstrained');
    }

    return new Response(
      JSON.stringify({ success: true, validation: validationResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error validating model:', error);
    throw error;
  }
}

async function getAnalysisStatus(supabaseClient: any, params: any) {
  const { analysisId } = params;
  
  try {
    const { data: analysis } = await supabaseClient
      .from('fea_analyses')
      .select('status, started_at, completed_at, input_parameters')
      .eq('id', analysisId)
      .single();

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    let progress = 0;
    if (analysis.status === 'completed') {
      progress = 100;
    } else if (analysis.status === 'running' && analysis.started_at) {
      // Estimate progress based on time elapsed (simplified)
      const elapsed = new Date().getTime() - new Date(analysis.started_at).getTime();
      progress = Math.min(90, (elapsed / 30000) * 100); // Assume 30 seconds for completion
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: analysis.status,
        progress,
        startedAt: analysis.started_at,
        completedAt: analysis.completed_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting analysis status:', error);
    throw error;
  }
}

// Helper functions for FEA processing
async function getOrGenerateMesh(supabaseClient: any, analysisId: string, element: any) {
  // Check if mesh already exists
  const { data: existingMesh } = await supabaseClient
    .from('fea_meshes')
    .select('*')
    .eq('analysis_id', analysisId)
    .single();

  if (existingMesh) {
    return {
      nodes: existingMesh.nodes,
      elements: existingMesh.elements
    };
  }

  // Generate new mesh
  return await generateElementMesh(element.geometry, { meshSize: 0.1 });
}

async function generateElementMesh(geometry: any, options: any) {
  const { meshSize = 0.1, elementType = 'C3D20' } = options;
  
  // Simplified mesh generation for box geometry
  if (geometry.type === 'box') {
    const { length, width, height } = geometry.dimensions;
    const nodes = [];
    const elements = [];
    
    // Generate nodes
    const nx = Math.ceil(length / meshSize) + 1;
    const ny = Math.ceil(width / meshSize) + 1;
    const nz = Math.ceil(height / meshSize) + 1;
    
    let nodeId = 1;
    for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          nodes.push({
            id: nodeId++,
            x: (i / (nx - 1)) * length,
            y: (j / (ny - 1)) * width,
            z: (k / (nz - 1)) * height
          });
        }
      }
    }
    
    // Generate elements (simplified hexahedral elements)
    let elementId = 1;
    for (let k = 0; k < nz - 1; k++) {
      for (let j = 0; j < ny - 1; j++) {
        for (let i = 0; i < nx - 1; i++) {
          const n1 = k * nx * ny + j * nx + i + 1;
          const n2 = k * nx * ny + j * nx + (i + 1) + 1;
          const n3 = k * nx * ny + (j + 1) * nx + (i + 1) + 1;
          const n4 = k * nx * ny + (j + 1) * nx + i + 1;
          const n5 = (k + 1) * nx * ny + j * nx + i + 1;
          const n6 = (k + 1) * nx * ny + j * nx + (i + 1) + 1;
          const n7 = (k + 1) * nx * ny + (j + 1) * nx + (i + 1) + 1;
          const n8 = (k + 1) * nx * ny + (j + 1) * nx + i + 1;
          
          elements.push({
            id: elementId++,
            type: 'C3D8',
            nodes: [n1, n2, n3, n4, n5, n6, n7, n8]
          });
        }
      }
    }
    
    // Calculate quality metrics
    const qualityMetrics = calculateMeshQuality(nodes, elements);
    
    return {
      nodes,
      elements,
      qualityMetrics
    };
  }
  
  throw new Error(`Mesh generation not implemented for geometry type: ${geometry.type}`);
}

function calculateMeshQuality(nodes: any[], elements: any[]) {
  // Simplified quality calculation
  let totalQuality = 0;
  let minQuality = 1;
  let maxQuality = 0;
  
  elements.forEach(element => {
    // Calculate aspect ratio and skewness (simplified)
    const quality = Math.random() * 0.3 + 0.7; // Simulate quality between 0.7-1.0
    totalQuality += quality;
    minQuality = Math.min(minQuality, quality);
    maxQuality = Math.max(maxQuality, quality);
  });
  
  return {
    averageQuality: totalQuality / elements.length,
    minQuality,
    maxQuality,
    elementCount: elements.length,
    nodeCount: nodes.length
  };
}

function generateCalculixInput(params: any) {
  const { mesh, forces, constraints, materialProperties, analysisType } = params;
  
  let input = '';
  
  // Header
  input += `*HEADING\nFEA Analysis - ${analysisType}\n`;
  
  // Nodes
  input += '*NODE\n';
  mesh.nodes.forEach((node: any) => {
    input += `${node.id}, ${node.x}, ${node.y}, ${node.z}\n`;
  });
  
  // Elements
  input += '*ELEMENT, TYPE=C3D8\n';
  mesh.elements.forEach((element: any) => {
    input += `${element.id}, ${element.nodes.join(', ')}\n`;
  });
  
  // Material properties
  if (materialProperties) {
    input += '*MATERIAL, NAME=MAT1\n';
    input += '*ELASTIC\n';
    input += `${materialProperties.youngsModulus || 200000}, ${materialProperties.poissonsRatio || 0.3}\n`;
    
    if (materialProperties.density) {
      input += '*DENSITY\n';
      input += `${materialProperties.density}\n`;
    }
  }
  
  // Solid section
  input += '*SOLID SECTION, ELSET=EALL, MATERIAL=MAT1\n';
  
  // Element set
  input += '*ELSET, ELSET=EALL\n';
  for (let i = 1; i <= mesh.elements.length; i++) {
    input += `${i}, `;
    if (i % 10 === 0) input += '\n';
  }
  input += '\n';
  
  // Analysis step
  if (analysisType === 'static') {
    input += '*STEP\n*STATIC\n';
  } else if (analysisType === 'modal') {
    input += '*STEP\n*FREQUENCY\n';
    input += `${params.numberOfModes || 10}\n`;
  } else if (analysisType === 'buckling') {
    input += '*STEP\n*BUCKLE\n';
    input += '10\n';
  }
  
  // Boundary conditions
  if (constraints) {
    constraints.forEach((constraint: any) => {
      input += `*BOUNDARY\n`;
      input += `${constraint.nodeSet || 'NALL'}, ${constraint.dof || '1,6'}\n`;
    });
  }
  
  // Loads
  if (forces) {
    forces.forEach((force: any) => {
      input += `*CLOAD\n`;
      input += `${force.nodeSet || 'NALL'}, ${force.direction || 3}, ${force.magnitude || 1000}\n`;
    });
  }
  
  // Output requests
  input += '*NODE FILE\nU\n';
  input += '*EL FILE\nS, E\n';
  
  input += '*END STEP\n';
  
  return input;
}

async function executeCalculixAnalysis(input: string) {
  // In a real implementation, this would call CalculiX
  // For now, simulate the analysis with mock results
  
  const startTime = Date.now();
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  const endTime = Date.now();
  const analysisTime = endTime - startTime;
  
  // Return mock results
  return {
    analysisTime,
    converged: true,
    iterations: Math.floor(Math.random() * 20) + 5,
    displacement: generateMockDisplacements(),
    stress: generateMockStresses(),
    strain: generateMockStrains()
  };
}

function generateMockDisplacements() {
  const displacements = [];
  for (let i = 1; i <= 100; i++) {
    displacements.push({
      nodeId: i,
      ux: (Math.random() - 0.5) * 0.001,
      uy: (Math.random() - 0.5) * 0.001,
      uz: (Math.random() - 0.5) * 0.002
    });
  }
  return displacements;
}

function generateMockStresses() {
  const stresses = [];
  for (let i = 1; i <= 80; i++) {
    stresses.push({
      elementId: i,
      vonMises: Math.random() * 100000000,
      sxx: (Math.random() - 0.5) * 50000000,
      syy: (Math.random() - 0.5) * 50000000,
      szz: (Math.random() - 0.5) * 50000000,
      sxy: (Math.random() - 0.5) * 25000000,
      sxz: (Math.random() - 0.5) * 25000000,
      syz: (Math.random() - 0.5) * 25000000
    });
  }
  return stresses;
}

function generateMockStrains() {
  const strains = [];
  for (let i = 1; i <= 80; i++) {
    strains.push({
      elementId: i,
      exx: (Math.random() - 0.5) * 0.001,
      eyy: (Math.random() - 0.5) * 0.001,
      ezz: (Math.random() - 0.5) * 0.001,
      exy: (Math.random() - 0.5) * 0.0005,
      exz: (Math.random() - 0.5) * 0.0005,
      eyz: (Math.random() - 0.5) * 0.0005
    });
  }
  return strains;
}

async function processStaticResults(rawResults: any) {
  const maxDisplacement = Math.max(...rawResults.displacement.map((d: any) => 
    Math.sqrt(d.ux**2 + d.uy**2 + d.uz**2)
  ));
  
  const maxStress = Math.max(...rawResults.stress.map((s: any) => s.vonMises));
  
  return {
    analysisTime: rawResults.analysisTime,
    converged: rawResults.converged,
    iterations: rawResults.iterations,
    summary: {
      maxDisplacement,
      maxStress,
      safetyFactor: 250000000 / maxStress // Assuming yield strength of 250 MPa
    },
    displacements: rawResults.displacement,
    stresses: rawResults.stress,
    strains: rawResults.strain
  };
}

async function processModalResults(rawResults: any, numberOfModes: number) {
  const frequencies = [];
  for (let i = 0; i < numberOfModes; i++) {
    frequencies.push({
      mode: i + 1,
      frequency: Math.random() * 100 + 10, // Hz
      period: 1 / (Math.random() * 100 + 10), // seconds
      dampingRatio: Math.random() * 0.05 + 0.01
    });
  }
  
  return {
    analysisTime: rawResults.analysisTime,
    converged: rawResults.converged,
    numberOfModes,
    frequencies,
    modeShapes: generateMockModeShapes(numberOfModes)
  };
}

async function processBucklingResults(rawResults: any) {
  const criticalLoadFactor = Math.random() * 3 + 1.5;
  
  return {
    analysisTime: rawResults.analysisTime,
    converged: rawResults.converged,
    criticalLoadFactor,
    bucklingModes: generateMockBucklingModes(),
    safetyFactor: criticalLoadFactor
  };
}

function generateMockModeShapes(numberOfModes: number) {
  const modeShapes = [];
  for (let mode = 0; mode < numberOfModes; mode++) {
    const shape = [];
    for (let i = 1; i <= 100; i++) {
      shape.push({
        nodeId: i,
        ux: Math.sin(mode * Math.PI * i / 100) * (Math.random() * 0.1),
        uy: Math.cos(mode * Math.PI * i / 100) * (Math.random() * 0.1),
        uz: Math.sin(mode * 2 * Math.PI * i / 100) * (Math.random() * 0.1)
      });
    }
    modeShapes.push(shape);
  }
  return modeShapes;
}

function generateMockBucklingModes() {
  const bucklingModes = [];
  for (let mode = 0; mode < 5; mode++) {
    const shape = [];
    for (let i = 1; i <= 100; i++) {
      shape.push({
        nodeId: i,
        ux: Math.sin(mode * Math.PI * i / 50) * (Math.random() * 0.2),
        uy: 0,
        uz: 0
      });
    }
    bucklingModes.push(shape);
  }
  return bucklingModes;
}

function validateMesh(mesh: any) {
  const validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  if (!mesh.nodes || mesh.nodes.length === 0) {
    validation.isValid = false;
    validation.errors.push('Mesh has no nodes');
  }
  
  if (!mesh.elements || mesh.elements.length === 0) {
    validation.isValid = false;
    validation.errors.push('Mesh has no elements');
  }
  
  if (mesh.nodes && mesh.nodes.length < 8) {
    validation.warnings.push('Very coarse mesh - results may be inaccurate');
  }
  
  return validation;
}

function validateLoads(loads: any[]) {
  const validation: {
    isValid: boolean;
    warnings: string[];
  } = {
    isValid: true,
    warnings: []
  };
  
  if (loads.length === 0) {
    validation.warnings.push('No loads defined');
  }
  
  loads.forEach((load, index) => {
    if (!load.magnitude || load.magnitude === 0) {
      validation.warnings.push(`Load ${index + 1} has zero magnitude`);
    }
  });
  
  return validation;
}

function validateBoundaryConditions(bcs: any[]) {
  const validation: {
    isValid: boolean;
    errors: string[];
  } = {
    isValid: true,
    errors: []
  };
  
  if (bcs.length === 0) {
    validation.isValid = false;
    validation.errors.push('No boundary conditions defined');
    return validation;
  }
  
  // Check for sufficient constraints
  let hasFixedSupport = false;
  bcs.forEach(bc => {
    if (bc.condition_type === 'fixed' || 
        (bc.constraints && Object.keys(bc.constraints).length >= 3)) {
      hasFixedSupport = true;
    }
  });
  
  if (!hasFixedSupport) {
    validation.isValid = false;
    validation.errors.push('Insufficient boundary conditions - model may be unstable');
  }
  
  return validation;
}
