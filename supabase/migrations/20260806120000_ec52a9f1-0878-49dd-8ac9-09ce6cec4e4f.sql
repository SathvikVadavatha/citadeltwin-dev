-- Add feedback column to client_portal_projects (Client Portal per-project feedback notes)
ALTER TABLE public.client_portal_projects ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Users can update their own client portal projects
DROP POLICY IF EXISTS "Users can update their own client portal projects" ON public.client_portal_projects;
CREATE POLICY "Users can update their own client portal projects"
ON public.client_portal_projects
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Users can delete their own client portal projects
DROP POLICY IF EXISTS "Users can delete their own client portal projects" ON public.client_portal_projects;
CREATE POLICY "Users can delete their own client portal projects"
ON public.client_portal_projects
FOR DELETE
USING (auth.uid() = created_by);
