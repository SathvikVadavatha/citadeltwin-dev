
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, uploadId } = await req.json();

    console.log('Starting Plane2Scene 3D generation for upload:', uploadId);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Plane2Scene API endpoint
    const plane2sceneUrl = 'https://api.plane2scene.com/v1/generate';
    
    // Prepare the request payload for Plane2Scene
    const payload = {
      image: imageData,
      format: 'glb',
      quality: 'high',
      include_textures: true,
      architectural_mode: true,
      scale_factor: 1.0
    };

    console.log('Calling Plane2Scene API...');

    // Call Plane2Scene API
    const response = await fetch(plane2sceneUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('PLANE2SCENE_API_KEY')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Plane2Scene API error:', response.status, errorText);
      throw new Error(`Plane2Scene API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Plane2Scene response received:', { hasModel: !!result.model_url, jobId: result.job_id });

    // Handle async processing if Plane2Scene returns a job ID
    let modelUrl = result.model_url;
    let modelData;

    if (result.job_id && !modelUrl) {
      // Poll for completion if it's an async job
      console.log('Polling for job completion:', result.job_id);
      
      const maxAttempts = 30; // 5 minutes maximum wait
      let attempts = 0;
      
      while (attempts < maxAttempts && !modelUrl) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await fetch(`https://api.plane2scene.com/v1/jobs/${result.job_id}`, {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('PLANE2SCENE_API_KEY')}`,
            'Accept': 'application/json'
          }
        });

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          console.log('Job status:', statusResult.status);
          
          if (statusResult.status === 'completed') {
            modelUrl = statusResult.model_url;
            break;
          } else if (statusResult.status === 'failed') {
            throw new Error('Plane2Scene job failed: ' + statusResult.error_message);
          }
        }
        
        attempts++;
      }

      if (!modelUrl) {
        throw new Error('Plane2Scene job timed out after 5 minutes');
      }
    }

    // Download the model from Plane2Scene
    if (modelUrl) {
      console.log('Downloading 3D model from:', modelUrl);
      
      const modelResponse = await fetch(modelUrl);
      if (!modelResponse.ok) {
        throw new Error('Failed to download 3D model from Plane2Scene');
      }
      
      modelData = await modelResponse.arrayBuffer();
    } else {
      throw new Error('No model URL received from Plane2Scene');
    }

    // Upload the model to Supabase Storage
    const fileName = `${uploadId}/plane2scene_model.glb`;
    
    const { error: uploadError } = await supabase.storage
      .from('3d-models')
      .upload(fileName, modelData, {
        contentType: 'model/gltf-binary',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Create the 3D model record
    const { data: modelRecord, error: insertError } = await supabase
      .from('generated_3d_models')
      .insert({
        upload_id: uploadId,
        model_name: `Plane2Scene_Model_${Date.now()}`,
        model_description: `3D model generated from architectural blueprint using Plane2Scene AI`,
        model_file_path: fileName,
        file_size: modelData.byteLength,
        generation_status: 'completed',
        generation_prompt: 'Architectural blueprint to 3D model conversion via Plane2Scene'
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('Plane2Scene 3D model generation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        modelId: modelRecord.id,
        modelUrl: fileName,
        message: '3D model generated successfully using Plane2Scene AI' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in Plane2Scene 3D generation:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: 'Using enhanced sample data generation instead'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
