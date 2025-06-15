
-- Create project_snapshots table for version control
CREATE TABLE public.project_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_name TEXT NOT NULL,
  description TEXT,
  snapshot_data JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  parent_snapshot_id UUID REFERENCES public.project_snapshots(id) ON DELETE SET NULL,
  branch_name TEXT NOT NULL DEFAULT 'main',
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_branches table for branch management
CREATE TABLE public.project_branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_snapshot_id UUID REFERENCES public.project_snapshots(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

-- Enable RLS on both tables
ALTER TABLE public.project_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_branches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_snapshots
CREATE POLICY "Users can view snapshots of their projects" 
  ON public.project_snapshots 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_snapshots.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create snapshots for their projects" 
  ON public.project_snapshots 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_snapshots.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update snapshots of their projects" 
  ON public.project_snapshots 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_snapshots.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete snapshots of their projects" 
  ON public.project_snapshots 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_snapshots.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Create RLS policies for project_branches
CREATE POLICY "Users can view branches of their projects" 
  ON public.project_branches 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_branches.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create branches for their projects" 
  ON public.project_branches 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_branches.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update branches of their projects" 
  ON public.project_branches 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_branches.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete branches of their projects" 
  ON public.project_branches 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_branches.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_project_snapshots_project_id ON public.project_snapshots(project_id);
CREATE INDEX idx_project_snapshots_branch_name ON public.project_snapshots(branch_name);
CREATE INDEX idx_project_snapshots_is_current ON public.project_snapshots(is_current);
CREATE INDEX idx_project_branches_project_id ON public.project_branches(project_id);

-- Insert default main branch for existing projects
INSERT INTO public.project_branches (project_id, name, description, created_by, created_at)
SELECT 
  p.id as project_id,
  'main' as name,
  'Default main branch' as description,
  p.owner_id as created_by,
  p.created_at
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_branches pb 
  WHERE pb.project_id = p.id AND pb.name = 'main'
);
