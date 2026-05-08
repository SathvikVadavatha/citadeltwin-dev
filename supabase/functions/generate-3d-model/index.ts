/**
 * generate-3d-model — Supabase Edge Function (Deno)
 * ===================================================
 *
 * Thin orchestrator that delegates blueprint → 3D conversion to the
 * external Python pipeline server.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // ---- CORS pre-flight ----
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { uploadId, imageUrl, uniqueFileName, isAIGenerated, detectedObjects } = await req.json();

    const PIPELINE_URL = Deno.env.get("PIPELINE_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PIPELINE_URL || !supabaseUrl || !supabaseKey) {
      throw new Error("Missing required environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ---- Resolve projectId ----
    let projectId = uploadId;
    try {
      const { data: uploadRow, error } = await supabase
        .from('blueprint_uploads')
        .select('project_id')
        .eq('id', uploadId)
        .single();
        
      if (!error && uploadRow?.project_id) {
        projectId = uploadRow.project_id;
      }
    } catch (e) {
      console.warn("[generate-3d-model] Failed to resolve projectId. Using uploadId as fallback.", e);
    }

    console.log(`[generate-3d-model] Calling pipeline for uploadId=${uploadId}, resolve projectId=${projectId}`);

    // ---- Call Python sidecar ----
    let pipelineData;
    try {
      const pipelineRes = await fetch(`${PIPELINE_URL}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl }),
      });

      if (!pipelineRes.ok) {
        const errText = await pipelineRes.text();
        throw new Error(`Pipeline error (${pipelineRes.status}): ${errText}`);
      }

      pipelineData = await pipelineRes.json();
    } catch (pipelineErr) {
      console.error("[generate-3d-model] Pipeline call failed:", pipelineErr);
      
      const errorMessage = pipelineErr instanceof Error ? pipelineErr.message : String(pipelineErr);

      // Insert fallback row
      await supabase.from('generated_3d_models').insert({
        upload_id: uploadId,
        model_name: `Fallback Model ${Date.now()}`,
        model_description: 'Pipeline unavailable — fallback record',
        model_file_path: 'placeholder.glb',
        file_size: 2048,
        generation_status: 'completed',
        generation_prompt: 'Fallback'
      });

      return new Response(
        JSON.stringify({ success: false, error: errorMessage, modelUrl: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { glb_base64, rooms, walls, metadata } = pipelineData;

    // ---- Upload GLB to Supabase Storage ----
    const glbBytes = Uint8Array.from(atob(glb_base64), (c) => c.charCodeAt(0));
    const glbPath = uniqueFileName ?? `models/${projectId}/${uploadId}.glb`;
    
    let storageErrorMsg: string | null = null;
    let finalPath = glbPath;
    let finalSize = glbBytes.length;

    const { error: uploadError } = await supabase.storage
      .from("3d-models")
      .upload(glbPath, glbBytes, {
        contentType: "model/gltf-binary",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-3d-model] Storage upload failed:", uploadError);
      storageErrorMsg = uploadError.message;
      finalPath = 'placeholder.glb';
      finalSize = 2048;
    }

    // ---- Insert row into generated_3d_models ----
    await supabase.from('generated_3d_models').insert({
      upload_id: uploadId,
      model_name: `Blueprint Model ${uploadId}`,
      model_description: `AI-generated 3D model — ${metadata?.total_rooms || 0} rooms, ${metadata?.wall_mesh_count || 0} wall segments`,
      model_file_path: finalPath,
      file_size: finalSize,
      generation_status: 'completed',
      generation_prompt: 'Python CV pipeline: YOLO + EasyOCR + Voronoi + trimesh'
    });

    if (storageErrorMsg) {
      return new Response(
        JSON.stringify({ success: false, error: storageErrorMsg, modelUrl: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: urlData } = supabase.storage
      .from("3d-models")
      .getPublicUrl(glbPath);

    // ---- Return success JSON ----
    return new Response(
      JSON.stringify({
        success: true,
        modelUrl: urlData.publicUrl,
        rooms,
        walls,
        metadata,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-3d-model] Unhandled error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        modelUrl: null
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
