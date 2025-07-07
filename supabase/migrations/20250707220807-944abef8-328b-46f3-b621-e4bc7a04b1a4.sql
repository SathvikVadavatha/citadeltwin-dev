-- Create IFC storage bucket for IFC files
INSERT INTO storage.buckets (id, name, public) VALUES ('ifc-models', 'ifc-models', true);

-- Create IFC storage policies for user access
CREATE POLICY "Users can upload IFC files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ifc-models' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view IFC files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ifc-models');

CREATE POLICY "Users can update their own IFC files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ifc-models' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own IFC files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ifc-models' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track IFC models
CREATE TABLE IF NOT EXISTS public.ifc_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  model_metadata JSONB DEFAULT '{}',
  upload_status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for IFC models
ALTER TABLE public.ifc_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create IFC models" 
ON public.ifc_models 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own IFC models" 
ON public.ifc_models 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own IFC models" 
ON public.ifc_models 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IFC models" 
ON public.ifc_models 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ifc_models_updated_at
BEFORE UPDATE ON public.ifc_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Extend bim_elements table to support IFC integration
ALTER TABLE public.bim_elements 
ADD COLUMN IF NOT EXISTS ifc_model_id UUID REFERENCES public.ifc_models(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ifc_element_guid TEXT,
ADD COLUMN IF NOT EXISTS ifc_properties JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Update RLS policies for bim_elements to include project-based access
DROP POLICY IF EXISTS "Users can create BIM elements for their uploads" ON public.bim_elements;
DROP POLICY IF EXISTS "Users can view BIM elements for their uploads" ON public.bim_elements;
DROP POLICY IF EXISTS "Users can update BIM elements for their uploads" ON public.bim_elements;
DROP POLICY IF EXISTS "Users can delete BIM elements for their uploads" ON public.bim_elements;

-- New comprehensive RLS policies for BIM elements supporting both upload and project access
CREATE POLICY "Users can create BIM elements" 
ON public.bim_elements 
FOR INSERT 
WITH CHECK (
  (upload_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM blueprint_uploads 
    WHERE id = bim_elements.upload_id AND user_id = auth.uid()
  )) OR 
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = bim_elements.project_id AND owner_id = auth.uid()
  ))
);

CREATE POLICY "Users can view BIM elements" 
ON public.bim_elements 
FOR SELECT 
USING (
  (upload_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM blueprint_uploads 
    WHERE id = bim_elements.upload_id AND user_id = auth.uid()
  )) OR 
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = bim_elements.project_id AND owner_id = auth.uid()
  ))
);

CREATE POLICY "Users can update BIM elements" 
ON public.bim_elements 
FOR UPDATE 
USING (
  (upload_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM blueprint_uploads 
    WHERE id = bim_elements.upload_id AND user_id = auth.uid()
  )) OR 
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = bim_elements.project_id AND owner_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete BIM elements" 
ON public.bim_elements 
FOR DELETE 
USING (
  (upload_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM blueprint_uploads 
    WHERE id = bim_elements.upload_id AND user_id = auth.uid()
  )) OR 
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = bim_elements.project_id AND owner_id = auth.uid()
  ))
);