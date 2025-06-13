
-- Create table for blueprint uploads
CREATE TABLE public.blueprint_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID NULL, -- Can be linked to a project later
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for object detection results
CREATE TABLE public.detection_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.blueprint_uploads(id) ON DELETE CASCADE NOT NULL,
  detected_objects JSONB NOT NULL, -- Array of detected objects with labels, confidence, coordinates
  processing_time_ms INTEGER,
  model_used TEXT,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for blueprint files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blueprints', 'blueprints', false);

-- Enable RLS on blueprint_uploads table
ALTER TABLE public.blueprint_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for blueprint_uploads
CREATE POLICY "Users can view their own uploads" 
  ON public.blueprint_uploads 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own uploads" 
  ON public.blueprint_uploads 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads" 
  ON public.blueprint_uploads 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads" 
  ON public.blueprint_uploads 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on detection_results table
ALTER TABLE public.detection_results ENABLE ROW LEVEL SECURITY;

-- Create policies for detection_results (access through upload ownership)
CREATE POLICY "Users can view detection results for their uploads" 
  ON public.detection_results 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.blueprint_uploads 
      WHERE id = detection_results.upload_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create detection results for their uploads" 
  ON public.detection_results 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blueprint_uploads 
      WHERE id = detection_results.upload_id 
      AND user_id = auth.uid()
    )
  );

-- Create storage policies for blueprints bucket
CREATE POLICY "Users can upload their own blueprints"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blueprints' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own blueprints"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blueprints' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own blueprints"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'blueprints' AND auth.uid()::text = (storage.foldername(name))[1]);
