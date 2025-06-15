
-- Create enum types for FEA system
CREATE TYPE public.analysis_type AS ENUM (
  'static', 'modal', 'buckling', 'thermal', 'dynamic'
);

CREATE TYPE public.analysis_status AS ENUM (
  'pending', 'running', 'completed', 'failed', 'cancelled'
);

CREATE TYPE public.load_type AS ENUM (
  'point_load', 'distributed_load', 'moment', 'pressure', 'temperature', 'gravity'
);

CREATE TYPE public.boundary_condition_type AS ENUM (
  'fixed', 'pinned', 'roller', 'free', 'symmetry'
);

-- Create FEA analyses table
CREATE TABLE public.fea_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.blueprint_uploads(id) ON DELETE CASCADE,
  element_id UUID REFERENCES public.bim_elements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  analysis_type analysis_type NOT NULL DEFAULT 'static',
  status analysis_status NOT NULL DEFAULT 'pending',
  input_parameters JSONB NOT NULL DEFAULT '{}', -- mesh settings, solver options, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create loads table for FEA input forces
CREATE TABLE public.fea_loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.fea_analyses(id) ON DELETE CASCADE NOT NULL,
  load_type load_type NOT NULL,
  name TEXT NOT NULL,
  magnitude DECIMAL(15,6) NOT NULL, -- force magnitude in Newtons
  direction JSONB NOT NULL, -- vector direction {x, y, z}
  location JSONB NOT NULL, -- application point/area {x, y, z} or geometry
  properties JSONB DEFAULT '{}', -- additional load properties
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create boundary conditions table
CREATE TABLE public.fea_boundary_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.fea_analyses(id) ON DELETE CASCADE NOT NULL,
  condition_type boundary_condition_type NOT NULL,
  name TEXT NOT NULL,
  location JSONB NOT NULL, -- nodes/surfaces where condition applies
  constraints JSONB NOT NULL, -- {x: true, y: false, z: true, rx: false, ry: false, rz: false}
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create FEA results table
CREATE TABLE public.fea_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.fea_analyses(id) ON DELETE CASCADE NOT NULL,
  result_type TEXT NOT NULL, -- 'displacement', 'stress', 'strain', 'reaction_forces'
  data JSONB NOT NULL, -- result data arrays/matrices
  metadata JSONB DEFAULT '{}', -- units, coordinate system, etc.
  file_path TEXT, -- optional file storage for large datasets
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mesh data table for FEA preprocessing
CREATE TABLE public.fea_meshes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.fea_analyses(id) ON DELETE CASCADE NOT NULL,
  element_type TEXT NOT NULL, -- 'tetrahedron', 'hexahedron', 'shell', 'beam'
  nodes JSONB NOT NULL, -- node coordinates
  elements JSONB NOT NULL, -- element connectivity
  properties JSONB DEFAULT '{}', -- mesh quality metrics, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all FEA tables
ALTER TABLE public.fea_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fea_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fea_boundary_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fea_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fea_meshes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for FEA analyses
CREATE POLICY "Users can view their own FEA analyses" ON public.fea_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create FEA analyses" ON public.fea_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own FEA analyses" ON public.fea_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own FEA analyses" ON public.fea_analyses FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for FEA loads (access through analysis ownership)
CREATE POLICY "Users can view loads for their analyses" ON public.fea_loads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.fea_analyses 
    WHERE id = fea_loads.analysis_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage loads for their analyses" ON public.fea_loads FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.fea_analyses 
    WHERE id = fea_loads.analysis_id AND user_id = auth.uid()
  )
);

-- Similar policies for boundary conditions
CREATE POLICY "Users can view boundary conditions for their analyses" ON public.fea_boundary_conditions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.fea_analyses 
    WHERE id = fea_boundary_conditions.analysis_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage boundary conditions for their analyses" ON public.fea_boundary_conditions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.fea_analyses 
    WHERE id = fea_boundary_conditions.analysis_id AND user_id = auth.uid()
  )
);

-- Similar policies for results
CREATE POLICY "Users can view results for their analyses" ON public.fea_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.fea_analyses 
    WHERE id = fea_results.analysis_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage results for their analyses" ON public.fea_results FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.fea_analyses 
    WHERE id = fea_results.analysis_id AND user_id = auth.uid()
  )
);

-- Similar policies for meshes
CREATE POLICY "Users can view meshes for their analyses" ON public.fea_meshes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.fea_analyses 
    WHERE id = fea_meshes.analysis_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage meshes for their analyses" ON public.fea_meshes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.fea_analyses 
    WHERE id = fea_meshes.analysis_id AND user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_fea_analyses_user_id ON public.fea_analyses(user_id);
CREATE INDEX idx_fea_analyses_status ON public.fea_analyses(status);
CREATE INDEX idx_fea_analyses_element_id ON public.fea_analyses(element_id);
CREATE INDEX idx_fea_loads_analysis_id ON public.fea_loads(analysis_id);
CREATE INDEX idx_fea_boundary_conditions_analysis_id ON public.fea_boundary_conditions(analysis_id);
CREATE INDEX idx_fea_results_analysis_id ON public.fea_results(analysis_id);
CREATE INDEX idx_fea_meshes_analysis_id ON public.fea_meshes(analysis_id);

-- Add trigger for updated_at timestamps
CREATE TRIGGER update_fea_analyses_updated_at 
  BEFORE UPDATE ON public.fea_analyses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
