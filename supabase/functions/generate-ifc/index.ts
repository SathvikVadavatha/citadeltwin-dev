import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IfcGenerationRequest {
  uploadId: string;
  geminiData: any;
  options?: {
    buildingName?: string;
    units?: 'metric' | 'imperial';
    includeStructural?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { uploadId, geminiData, options = {} }: IfcGenerationRequest = await req.json();

    console.log('🚀 Starting IFC generation for upload:', uploadId);

    // Validate upload belongs to user
    const { data: upload, error: uploadError } = await supabase
      .from('blueprint_uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single();

    if (uploadError || !upload) {
      throw new Error('Upload not found or access denied');
    }

    // Create IFC generation job record
    const { data: job, error: jobError } = await supabase
      .from('ifc_generation_jobs')
      .insert({
        upload_id: uploadId,
        user_id: user.id,
        status: 'processing',
        input_data: {
          geminiData,
          options,
          originalFilename: upload.original_filename
        }
      })
      .select()
      .single();

    if (jobError) {
      throw new Error('Failed to create IFC generation job');
    }

    console.log('📋 Created IFC generation job:', job.id);

    // Start background processing
    EdgeRuntime.waitUntil(processIfcGeneration(supabase, job, geminiData, options));

    return new Response(JSON.stringify({
      success: true,
      jobId: job.id,
      status: 'processing',
      message: 'IFC generation started'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in generate-ifc function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processIfcGeneration(
  supabase: any, 
  job: any, 
  geminiData: any, 
  options: any
) {
  const startTime = Date.now();

  try {
    console.log('🔧 Processing IFC generation for job:', job.id);

    // Prepare Blender script execution data
    const blenderInput = {
      json_data: geminiData,
      output_filename: `${job.upload_id}_${Date.now()}.ifc`,
      options: {
        building_name: options.buildingName || 'Generated Building',
        units: options.units || 'metric',
        include_structural: options.includeStructural !== false
      }
    };

    // For now, we'll simulate the Blender processing
    // In production, this would call an external Python service
    console.log('🎯 Simulating Blender IFC generation...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create a mock IFC file content
    const ifcContent = generateMockIfcContent(geminiData, options);
    
    // Upload the IFC file to storage
    const fileName = `${job.user_id}/${blenderInput.output_filename}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ifc-models')
      .upload(fileName, new Blob([ifcContent], { type: 'application/step' }));

    if (uploadError) {
      throw new Error(`Failed to upload IFC file: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('ifc-models')
      .getPublicUrl(fileName);

    const processingTime = Date.now() - startTime;

    // Update job status to completed
    await supabase
      .from('ifc_generation_jobs')
      .update({
        status: 'completed',
        output_file_path: fileName,
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log('✅ IFC generation completed for job:', job.id);
    console.log('📁 File uploaded to:', fileName);
    console.log('🔗 Public URL:', urlData.publicUrl);

  } catch (error) {
    console.error('💥 Error processing IFC generation:', error);

    // Update job status to failed
    await supabase
      .from('ifc_generation_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        processing_time_ms: Date.now() - startTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);
  }
}

function generateMockIfcContent(geminiData: any, options: any): string {
  const timestamp = new Date().toISOString();
  
  // Generate a basic IFC file structure
  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView_V2.0]'),'2;1');
FILE_NAME('generated_building.ifc','${timestamp}',('CitadelTwin'),('Community Dreams Foundation'),'PreProc - EXPRESS Processor','CitadelTwin','Unknown');
FILE_SCHEMA(('IFC2X3'));
ENDSEC;

DATA;
#1= IFCPERSON($,'','CitadelTwin',$,$,$,$,$);
#2= IFCORGANIZATION($,'Community Dreams Foundation',$,$,$);
#3= IFCPERSONANDORGANIZATION(#1,#2,$);
#4= IFCAPPLICATION(#2,'1.0','CitadelTwin','CitadelTwin');
#5= IFCOWNERHISTORY(#3,#4,$,.ADDED.,${Math.floor(Date.now()/1000)},$,$,${Math.floor(Date.now()/1000)});
#6= IFCDIRECTION((1.,0.,0.));
#7= IFCDIRECTION((0.,0.,1.));
#8= IFCCARTESIANPOINT((0.,0.,0.));
#9= IFCAXIS2PLACEMENT3D(#8,#7,#6);
#10= IFCDIRECTION((0.,1.,0.));
#11= IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#9,#10);
#12= IFCDIMENSIONALEXPONENTS(0,0,0,0,0,0,0);
#13= IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);
#14= IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);
#15= IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);
#16= IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.);
#17= IFCMEASUREWITHUNIT(IFCPLANEANGLEMEASURE(0.017453292519943295),#16);
#18= IFCCONVERSIONBASEDUNIT(#12,.PLANEANGLEUNIT.,'DEGREE',#17);
#19= IFCUNITASSIGNMENT((#13,#14,#15,#18));
#20= IFCPROJECT('${crypto.randomUUID()}',#5,'${options.buildingName || 'Generated Building'}',$,$,$,$,(#11),#19);

/* Generated from Gemini AI analysis with ${Object.keys(geminiData.elements || {}).length} elements */
/* Building contains: ${(geminiData.rooms || []).length} rooms */
/* Processing options: ${JSON.stringify(options)} */

ENDSEC;
END-ISO-10303-21;
`;
}