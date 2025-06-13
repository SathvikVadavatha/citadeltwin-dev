
-- Create table for 3D models
CREATE TABLE public.generated_3d_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.blueprint_uploads(id) ON DELETE CASCADE NOT NULL,
  model_name TEXT NOT NULL,
  model_description TEXT,
  model_file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  generation_status TEXT NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  generation_prompt TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public) 
VALUES ('3d-models', '3d-models', true);

-- Enable RLS on generated_3d_models table
ALTER TABLE public.generated_3d_models ENABLE ROW LEVEL SECURITY;

-- Create policies for generated_3d_models (access through upload ownership)
CREATE POLICY "Users can view 3D models for their uploads" 
  ON public.generated_3d_models 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.blueprint_uploads 
      WHERE id = generated_3d_models.upload_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create 3D models for their uploads" 
  ON public.generated_3d_models 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blueprint_uploads 
      WHERE id = generated_3d_models.upload_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update 3D models for their uploads" 
  ON public.generated_3d_models 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.blueprint_uploads 
      WHERE id = generated_3d_models.upload_id 
      AND user_id = auth.uid()
    )
  );

-- Create storage policies for 3d-models bucket
CREATE POLICY "Users can upload their own 3D models"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = '3d-models' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own 3D models"
  ON storage.objects FOR SELECT
  USING (bucket_id = '3d-models' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own 3D models"
  ON storage.objects FOR DELETE
  USING (bucket_id = '3d-models' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generated_3d_models_updated_at 
  BEFORE UPDATE ON public.generated_3d_models 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
