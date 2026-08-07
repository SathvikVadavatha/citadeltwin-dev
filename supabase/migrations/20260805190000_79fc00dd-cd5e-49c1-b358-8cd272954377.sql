-- Create client_portal_projects table (Client Portal "Add New Project" input capture)
CREATE TABLE public.client_portal_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  site_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  building_type TEXT,
  building_sub_type TEXT,
  blueprint_file_name TEXT,
  blueprint_file_size BIGINT,
  blueprint_file_type TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'uploaded', 'feedback', 'approved')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_portal_projects ENABLE ROW LEVEL SECURITY;

-- Users can only see the projects they created
CREATE POLICY "Users can view their own client portal projects"
ON public.client_portal_projects
FOR SELECT
USING (auth.uid() = created_by);

-- Users can only insert projects owned by themselves
CREATE POLICY "Users can insert their own client portal projects"
ON public.client_portal_projects
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Index for the per-user list query
CREATE INDEX idx_client_portal_projects_created_by ON public.client_portal_projects(created_by);

-- Keep updated_at current on every row update
CREATE TRIGGER update_client_portal_projects_updated_at
  BEFORE UPDATE ON public.client_portal_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
