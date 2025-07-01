
-- Fix the blueprint_uploads status constraint issue
ALTER TABLE blueprint_uploads 
DROP CONSTRAINT IF EXISTS blueprint_uploads_upload_status_check;

-- Add a more comprehensive status constraint that includes all processing states
ALTER TABLE blueprint_uploads 
ADD CONSTRAINT blueprint_uploads_upload_status_check 
CHECK (upload_status IN (
  'uploaded', 
  'processing', 
  'processed', 
  'processed_fallback', 
  'failed', 
  'completed'
));

-- Add missing metadata column to detection_results if it doesn't exist
ALTER TABLE detection_results 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Ensure the detection_results table has proper structure for Plan2Scene integration
ALTER TABLE detection_results 
ADD COLUMN IF NOT EXISTS processing_method TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- Update the generated_3d_models table to ensure it can handle Plan2Scene models
ALTER TABLE generated_3d_models 
ALTER COLUMN generation_status TYPE TEXT,
DROP CONSTRAINT IF EXISTS generated_3d_models_generation_status_check;

ALTER TABLE generated_3d_models 
ADD CONSTRAINT generated_3d_models_generation_status_check 
CHECK (generation_status IN (
  'pending', 
  'processing', 
  'completed', 
  'failed', 
  'generating'
));

-- Ensure the blueprints storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blueprints', 
  'blueprints', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

-- Ensure the 3d-models storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '3d-models', 
  '3d-models', 
  true, 
  104857600, -- 100MB limit
  ARRAY['model/gltf-binary', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['model/gltf-binary', 'application/octet-stream'];

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Public Access for Blueprints" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for 3D Models" ON storage.objects;

-- Create storage policies for blueprints bucket
CREATE POLICY "Public Access for Blueprints"
ON storage.objects FOR ALL
USING (bucket_id = 'blueprints');

-- Create storage policies for 3d-models bucket
CREATE POLICY "Public Access for 3D Models"
ON storage.objects FOR ALL
USING (bucket_id = '3d-models');
