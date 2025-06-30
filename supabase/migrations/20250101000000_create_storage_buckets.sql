
-- Create storage buckets for blueprints and 3D models
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('blueprints', 'blueprints', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']),
  ('3d-models', '3d-models', true, 52428800, ARRAY['model/gltf-binary', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policies for blueprints bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'blueprints');
CREATE POLICY "Authenticated users can upload blueprints" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blueprints' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own blueprints" ON storage.objects FOR UPDATE USING (bucket_id = 'blueprints' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own blueprints" ON storage.objects FOR DELETE USING (bucket_id = 'blueprints' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for 3d-models bucket  
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = '3d-models');
CREATE POLICY "Authenticated users can upload 3d models" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '3d-models' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own 3d models" ON storage.objects FOR UPDATE USING (bucket_id = '3d-models' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own 3d models" ON storage.objects FOR DELETE USING (bucket_id = '3d-models' AND auth.uid()::text = (storage.foldername(name))[1]);
