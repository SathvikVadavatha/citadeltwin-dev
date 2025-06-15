
-- Create collaboration sessions table
CREATE TABLE public.collaboration_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Create user presence table
CREATE TABLE public.user_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cursor_position JSONB,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_color TEXT NOT NULL DEFAULT '#3B82F6',
  UNIQUE(session_id, user_id)
);

-- Create collaboration changes table for operational transformation
CREATE TABLE public.collaboration_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'transform'
  element_id UUID,
  element_type TEXT,
  operation_data JSONB NOT NULL,
  operation_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE,
  conflict_resolved BOOLEAN DEFAULT false
);

-- Create collaboration permissions table
CREATE TABLE public.collaboration_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'view', -- 'owner', 'edit', 'view'
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_sessions
CREATE POLICY "Users can view sessions they have permission for" 
  ON public.collaboration_sessions 
  FOR SELECT 
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.collaboration_permissions 
      WHERE session_id = collaboration_sessions.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own sessions" 
  ON public.collaboration_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Session owners can update their sessions" 
  ON public.collaboration_sessions 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- RLS Policies for user_presence
CREATE POLICY "Users can view presence in sessions they have access to" 
  ON public.user_presence 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions cs
      LEFT JOIN public.collaboration_permissions cp ON cs.id = cp.session_id
      WHERE cs.id = user_presence.session_id 
      AND (cs.created_by = auth.uid() OR cp.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage their own presence" 
  ON public.user_presence 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for collaboration_changes
CREATE POLICY "Users can view changes in sessions they have access to" 
  ON public.collaboration_changes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions cs
      LEFT JOIN public.collaboration_permissions cp ON cs.id = cp.session_id
      WHERE cs.id = collaboration_changes.session_id 
      AND (cs.created_by = auth.uid() OR cp.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create changes in sessions they have edit permission" 
  ON public.collaboration_changes 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions cs
      LEFT JOIN public.collaboration_permissions cp ON cs.id = cp.session_id
      WHERE cs.id = collaboration_changes.session_id 
      AND (cs.created_by = auth.uid() OR (cp.user_id = auth.uid() AND cp.permission_level IN ('edit', 'owner')))
    )
  );

-- RLS Policies for collaboration_permissions
CREATE POLICY "Users can view permissions for sessions they have access to" 
  ON public.collaboration_permissions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions cs
      WHERE cs.id = collaboration_permissions.session_id 
      AND cs.created_by = auth.uid()
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Session owners can manage permissions" 
  ON public.collaboration_permissions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions cs
      WHERE cs.id = collaboration_permissions.session_id 
      AND cs.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions cs
      WHERE cs.id = collaboration_permissions.session_id 
      AND cs.created_by = auth.uid()
    )
  );

-- Enable realtime for all collaboration tables
ALTER TABLE public.collaboration_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
ALTER TABLE public.collaboration_changes REPLICA IDENTITY FULL;
ALTER TABLE public.collaboration_permissions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_changes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_permissions;

-- Create indexes for better performance
CREATE INDEX idx_collaboration_sessions_project_id ON public.collaboration_sessions(project_id);
CREATE INDEX idx_user_presence_session_id ON public.user_presence(session_id);
CREATE INDEX idx_collaboration_changes_session_id ON public.collaboration_changes(session_id);
CREATE INDEX idx_collaboration_changes_operation_index ON public.collaboration_changes(session_id, operation_index);
CREATE INDEX idx_collaboration_permissions_session_user ON public.collaboration_permissions(session_id, user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collaboration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for collaboration_sessions
CREATE TRIGGER update_collaboration_sessions_updated_at
    BEFORE UPDATE ON public.collaboration_sessions
    FOR EACH ROW
    EXECUTE PROCEDURE update_collaboration_updated_at();
