
-- Create client_feedback table
CREATE TABLE public.client_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  project_id UUID REFERENCES public.projects(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_shares table
CREATE TABLE public.project_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"can_view": true, "can_comment": false, "can_approve": false}',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_notifications table
CREATE TABLE public.client_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_email TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_progress table
CREATE TABLE public.project_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  milestones JSONB DEFAULT '[]',
  recent_updates JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for client_feedback
CREATE POLICY "Users can view feedback by email" ON public.client_feedback
  FOR SELECT USING (client_email = (auth.jwt()->>'email'));

CREATE POLICY "Users can create feedback" ON public.client_feedback
  FOR INSERT WITH CHECK (true);

-- Create policies for project_shares
CREATE POLICY "Users can view shares for their projects" ON public.project_shares
  FOR SELECT USING (
    shared_by = auth.uid() OR 
    shared_with_email = (auth.jwt()->>'email')
  );

CREATE POLICY "Users can create shares for their projects" ON public.project_shares
  FOR INSERT WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can update shares they created" ON public.project_shares
  FOR UPDATE USING (shared_by = auth.uid());

-- Create policies for client_notifications
CREATE POLICY "Users can view their notifications" ON public.client_notifications
  FOR SELECT USING (client_email = (auth.jwt()->>'email'));

-- Create policies for project_progress
CREATE POLICY "Users can view progress for shared projects" ON public.project_progress
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM public.project_shares 
      WHERE shared_with_email = (auth.jwt()->>'email') AND status = 'active'
    )
  );

-- Add updated_at trigger for all tables
CREATE TRIGGER update_client_feedback_updated_at
  BEFORE UPDATE ON public.client_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_shares_updated_at
  BEFORE UPDATE ON public.project_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_progress_updated_at
  BEFORE UPDATE ON public.project_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
