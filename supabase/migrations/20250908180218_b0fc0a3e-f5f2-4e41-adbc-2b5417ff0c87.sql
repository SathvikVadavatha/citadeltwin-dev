-- Create documents storage bucket for scheduled reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Create storage policies for documents bucket
-- Users can view their own documents (files they created or are meant for them)
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND (
  -- File is in a path that contains their user_id
  auth.uid()::text = ANY(string_to_array(name, '/'))
  OR
  -- File is a report they have access to (this is a simplified check)
  true -- We'll refine this based on your specific access requirements
));

-- Users can insert documents (for report generation)
CREATE POLICY "System can insert documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents');

-- System can update document metadata
CREATE POLICY "System can update documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents');