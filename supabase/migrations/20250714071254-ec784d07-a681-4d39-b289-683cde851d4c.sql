-- Create storage bucket for IFC files
INSERT INTO storage.buckets (id, name, public) VALUES ('ifc-models', 'ifc-models', true);

-- Create policies for IFC models bucket
CREATE POLICY "Users can upload IFC models to their folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'ifc-models' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view IFC models in their folder" ON storage.objects
FOR SELECT USING (
  bucket_id = 'ifc-models' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public read access for IFC models" ON storage.objects
FOR SELECT USING (bucket_id = 'ifc-models');

-- Create table for tracking IFC generation jobs
CREATE TABLE public.ifc_generation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_data JSONB NOT NULL,
  output_file_path TEXT,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (upload_id) REFERENCES blueprint_uploads(id) ON DELETE CASCADE
);

-- Enable RLS on IFC generation jobs
ALTER TABLE public.ifc_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for IFC generation jobs
CREATE POLICY "Users can create IFC generation jobs for their uploads" 
ON public.ifc_generation_jobs 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM blueprint_uploads 
    WHERE id = upload_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own IFC generation jobs" 
ON public.ifc_generation_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own IFC generation jobs" 
ON public.ifc_generation_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);