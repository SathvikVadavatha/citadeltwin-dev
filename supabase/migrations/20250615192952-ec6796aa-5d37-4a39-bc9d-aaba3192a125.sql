
-- Create projects table that's referenced but missing
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = owner_id);

-- Add missing foreign key constraints to existing tables
ALTER TABLE public.blueprint_uploads ADD CONSTRAINT fk_blueprint_uploads_project_id 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.bim_elements ADD CONSTRAINT fk_bim_elements_upload_id 
  FOREIGN KEY (upload_id) REFERENCES public.blueprint_uploads(id) ON DELETE CASCADE;

ALTER TABLE public.bim_elements ADD CONSTRAINT fk_bim_elements_material_id 
  FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE SET NULL;

ALTER TABLE public.bim_elements ADD CONSTRAINT fk_bim_elements_parent_id 
  FOREIGN KEY (parent_element_id) REFERENCES public.bim_elements(id) ON DELETE SET NULL;

-- Add spatial processing capabilities to GIS layers
ALTER TABLE public.gis_layers ADD COLUMN IF NOT EXISTS bbox JSONB; -- Bounding box
ALTER TABLE public.gis_layers ADD COLUMN IF NOT EXISTS coordinate_system TEXT DEFAULT 'EPSG:4326';
ALTER TABLE public.gis_layers ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'ready';

-- Create spatial analysis results table
CREATE TABLE IF NOT EXISTS public.spatial_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_type TEXT NOT NULL, -- 'intersection', 'buffer', 'proximity', etc.
  input_layer_ids UUID[] NOT NULL,
  result_data JSONB NOT NULL,
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on spatial analysis results
ALTER TABLE public.spatial_analysis_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for spatial analysis results
CREATE POLICY "Users can view their own spatial analysis results" ON public.spatial_analysis_results 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create spatial analysis results" ON public.spatial_analysis_results 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_gis_layers_layer_type ON public.gis_layers(layer_type);
CREATE INDEX IF NOT EXISTS idx_gis_layers_city_state ON public.gis_layers(city, state);
CREATE INDEX IF NOT EXISTS idx_spatial_analysis_results_user_id ON public.spatial_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_spatial_analysis_results_analysis_type ON public.spatial_analysis_results(analysis_type);

-- Add trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON public.projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
