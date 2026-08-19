import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callBlueprintPipeline, decodeGlbBase64, DEFAULT_PIPELINE_TIMEOUT_MS } from '@/lib/blueprintPipeline';

const PROCESSED_UPLOAD_STATUSES = new Set(['processed', 'processed_fallback', 'completed']);
const POLL_INTERVAL_MS = 3000;

export type BlueprintModelGenerationState =
  | 'loading'
  | 'idle'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'unavailable';

interface BlueprintUploadRow {
  storage_path: string;
  upload_status: string | null;
  original_filename: string;
}

interface UseBlueprintModelGenerationReturn {
  state: BlueprintModelGenerationState;
  modelUrl: string | null;
  originalFilename: string | null;
  /** True when the most recent completed model is a dead blob: URL from before this feature existed. */
  isLegacyExpiredModel: boolean;
  errorMessage: string | null;
  unavailableReason: string | null;
  /** Runs the pipeline against the blueprint's already-stored image. Also used to retry/regenerate. */
  startGeneration: () => Promise<void>;
}

/**
 * Given a blueprint_uploads id, determines whether a 3D model already exists,
 * is currently generating (possibly started from a different page mount —
 * this polls the DB row rather than any local/component state), or needs to
 * be generated from the blueprint's already-uploaded image. Never re-uploads
 * the image; never regenerates a model that already exists and is valid.
 */
export const useBlueprintModelGeneration = (uploadId?: string): UseBlueprintModelGenerationReturn => {
  const [state, setState] = useState<BlueprintModelGenerationState>('loading');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isLegacyExpiredModel, setIsLegacyExpiredModel] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);

  const blueprintRef = useRef<BlueprintUploadRow | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const cancelledRef = useRef(false);

  const checkStatus = useCallback(async () => {
    if (!uploadId) return;

    if (!blueprintRef.current) {
      const { data: upload, error: uploadError } = await supabase
        .from('blueprint_uploads')
        .select('storage_path, upload_status, original_filename')
        .eq('id', uploadId)
        .maybeSingle();

      if (cancelledRef.current) return;

      if (uploadError || !upload) {
        setState('unavailable');
        setUnavailableReason('This blueprint could not be found.');
        return;
      }

      blueprintRef.current = upload;
      setOriginalFilename(upload.original_filename);
    }

    const { data: model, error: modelError } = await supabase
      .from('generated_3d_models')
      .select('id, model_file_path, generation_status, error_message')
      .eq('upload_id', uploadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cancelledRef.current) return;

    if (modelError) {
      setState('failed');
      setErrorMessage(modelError.message);
      return;
    }

    if (model) {
      if (model.generation_status === 'completed') {
        const path = model.model_file_path || '';
        if (path.startsWith('blob:')) {
          setIsLegacyExpiredModel(true);
          setState('failed');
          setErrorMessage('This 3D model preview expired at the end of the browser session that created it.');
        } else {
          setModelUrl(path);
          setIsLegacyExpiredModel(false);
          setState('completed');
        }
        return;
      }

      if (model.generation_status === 'failed') {
        setState('failed');
        setIsLegacyExpiredModel(false);
        setErrorMessage(model.error_message || 'The last 3D generation attempt failed.');
        return;
      }

      // 'pending' | 'generating' — someone (possibly another tab/page mount)
      // already kicked this off. Watch the row instead of starting a new run.
      setState('generating');
      pollTimerRef.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
      return;
    }

    const uploadStatus = blueprintRef.current?.upload_status ?? '';
    if (PROCESSED_UPLOAD_STATUSES.has(uploadStatus)) {
      setState('idle');
    } else {
      setState('unavailable');
      setUnavailableReason(
        uploadStatus === 'uploaded' || uploadStatus === 'processing'
          ? 'This blueprint is still processing.'
          : 'This blueprint failed processing, so no 3D model can be generated yet.'
      );
    }
  }, [uploadId]);

  useEffect(() => {
    cancelledRef.current = false;
    blueprintRef.current = null;
    setState('loading');
    checkStatus();

    return () => {
      cancelledRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [checkStatus]);

  const startGeneration = useCallback(async () => {
    if (!uploadId || !blueprintRef.current?.storage_path) return;

    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    setState('generating');
    setErrorMessage(null);
    setIsLegacyExpiredModel(false);

    const { data: publicUrlData } = supabase.storage
      .from('blueprints')
      .getPublicUrl(blueprintRef.current.storage_path);
    const imageUrl = publicUrlData.publicUrl;

    const { data: placeholder, error: insertError } = await supabase
      .from('generated_3d_models')
      .insert({
        upload_id: uploadId,
        model_name: `Blueprint Model ${uploadId}`,
        model_description: 'AI-generated 3D model from blueprint upload',
        model_file_path: 'pending',
        file_size: 0,
        generation_status: 'generating',
      })
      .select('id')
      .single();

    if (insertError || !placeholder) {
      setState('failed');
      setErrorMessage(insertError?.message || 'Could not start 3D generation.');
      return;
    }

    try {
      const pipelineData = await callBlueprintPipeline(imageUrl, { timeoutMs: DEFAULT_PIPELINE_TIMEOUT_MS });

      if (!pipelineData.glb_base64) {
        throw new Error('The pipeline did not return a 3D model for this blueprint.');
      }

      const glbBytes = decodeGlbBase64(pipelineData.glb_base64);
      const storagePath = `blueprints/${uploadId}/model_${Date.now()}.glb`;

      const { error: uploadErr } = await supabase.storage
        .from('3d-models')
        .upload(storagePath, glbBytes, { contentType: 'model/gltf-binary', upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('3d-models').getPublicUrl(storagePath);
      const finalUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('generated_3d_models')
        .update({
          model_file_path: finalUrl,
          file_size: glbBytes.length,
          generation_status: 'completed',
        })
        .eq('id', placeholder.id);
      if (updateError) throw updateError;

      if (cancelledRef.current) return;
      setModelUrl(finalUrl);
      setState('completed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not generate a 3D model for this blueprint.';

      await supabase
        .from('generated_3d_models')
        .update({ generation_status: 'failed', error_message: message })
        .eq('id', placeholder.id);

      if (cancelledRef.current) return;
      setState('failed');
      setErrorMessage(message);
    }
  }, [uploadId]);

  return {
    state,
    modelUrl,
    originalFilename,
    isLegacyExpiredModel,
    errorMessage,
    unavailableReason,
    startGeneration,
  };
};
