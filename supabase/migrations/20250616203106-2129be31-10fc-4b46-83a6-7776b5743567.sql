
-- Create workflow templates table
CREATE TABLE public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'residential', 'commercial', 'industrial', 'infrastructure'
  building_type TEXT, -- 'single_family', 'multi_family', 'office', 'warehouse', etc.
  template_data JSONB NOT NULL DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]', -- Array of workflow steps
  automation_rules JSONB DEFAULT '{}',
  parameters JSONB NOT NULL DEFAULT '[]', -- Template parameters/variables
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project workflows table
CREATE TABLE public.project_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workflow_templates(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  current_step INTEGER DEFAULT 0,
  steps JSONB NOT NULL DEFAULT '[]',
  automation_config JSONB DEFAULT '{}',
  progress_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow executions table
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.project_workflows(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create building type templates table
CREATE TABLE public.building_type_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  building_type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  default_parameters JSONB NOT NULL DEFAULT '{}',
  required_compliance_checks JSONB DEFAULT '[]',
  typical_materials JSONB DEFAULT '[]',
  standard_elements JSONB DEFAULT '[]',
  design_requirements JSONB DEFAULT '{}',
  code_requirements JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automated project setups table
CREATE TABLE public.automated_project_setups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.building_type_templates(id),
  setup_parameters JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress_percentage INTEGER DEFAULT 0,
  steps_completed JSONB DEFAULT '[]',
  error_logs JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow triggers table
CREATE TABLE public.workflow_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.project_workflows(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- 'manual', 'time_based', 'event_based', 'condition_based'
  trigger_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_type_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_project_setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow templates
CREATE POLICY "Users can view active workflow templates" ON public.workflow_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create workflow templates" ON public.workflow_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own workflow templates" ON public.workflow_templates
  FOR UPDATE USING (auth.uid() = created_by AND is_system_template = false);

-- RLS Policies for project workflows
CREATE POLICY "Users can view workflows for their projects" ON public.project_workflows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage workflows for their projects" ON public.project_workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for workflow executions
CREATE POLICY "Users can view executions for their workflows" ON public.workflow_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_workflows pw
      JOIN public.projects p ON p.id = pw.project_id
      WHERE pw.id = workflow_id AND p.owner_id = auth.uid()
    )
  );

-- RLS Policies for building type templates
CREATE POLICY "Users can view active building templates" ON public.building_type_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create building templates" ON public.building_type_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own building templates" ON public.building_type_templates
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for automated project setups
CREATE POLICY "Users can view their project setups" ON public.automated_project_setups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their project setups" ON public.automated_project_setups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for workflow triggers
CREATE POLICY "Users can view triggers for their workflows" ON public.workflow_triggers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_workflows pw
      JOIN public.projects p ON p.id = pw.project_id
      WHERE pw.id = workflow_id AND p.owner_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX idx_workflow_templates_building_type ON public.workflow_templates(building_type);
CREATE INDEX idx_project_workflows_project_id ON public.project_workflows(project_id);
CREATE INDEX idx_project_workflows_status ON public.project_workflows(status);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_building_type_templates_category ON public.building_type_templates(category);
CREATE INDEX idx_automated_project_setups_project_id ON public.automated_project_setups(project_id);

-- Create function to execute workflow step
CREATE OR REPLACE FUNCTION public.execute_workflow_step(
  p_workflow_id UUID,
  p_step_index INTEGER,
  p_input_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  execution_id UUID;
  workflow_data RECORD;
  step_data JSONB;
BEGIN
  -- Get workflow and step data
  SELECT * INTO workflow_data FROM public.project_workflows WHERE id = p_workflow_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found';
  END IF;
  
  step_data := workflow_data.steps->p_step_index;
  
  IF step_data IS NULL THEN
    RAISE EXCEPTION 'Step not found';
  END IF;
  
  -- Create execution record
  INSERT INTO public.workflow_executions (
    workflow_id,
    step_index,
    step_name,
    status,
    input_data,
    started_at
  ) VALUES (
    p_workflow_id,
    p_step_index,
    step_data->>'name',
    'running',
    p_input_data,
    now()
  ) RETURNING id INTO execution_id;
  
  -- Update workflow current step
  UPDATE public.project_workflows 
  SET current_step = p_step_index,
      updated_at = now()
  WHERE id = p_workflow_id;
  
  RETURN execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to complete workflow step
CREATE OR REPLACE FUNCTION public.complete_workflow_step(
  p_execution_id UUID,
  p_output_data JSONB DEFAULT '{}',
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  execution_data RECORD;
  workflow_id UUID;
  next_step INTEGER;
  total_steps INTEGER;
BEGIN
  -- Get execution data
  SELECT * INTO execution_data FROM public.workflow_executions WHERE id = p_execution_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Execution not found';
  END IF;
  
  workflow_id := execution_data.workflow_id;
  
  -- Update execution record
  UPDATE public.workflow_executions 
  SET status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
      output_data = p_output_data,
      error_message = p_error_message,
      completed_at = now()
  WHERE id = p_execution_id;
  
  -- If successful, check if we should proceed to next step
  IF p_success THEN
    SELECT 
      current_step + 1,
      jsonb_array_length(steps)
    INTO next_step, total_steps
    FROM public.project_workflows 
    WHERE id = workflow_id;
    
    -- Update workflow status
    IF next_step >= total_steps THEN
      -- Workflow completed
      UPDATE public.project_workflows 
      SET status = 'completed',
          updated_at = now()
      WHERE id = workflow_id;
    ELSE
      -- Move to next step
      UPDATE public.project_workflows 
      SET current_step = next_step,
          updated_at = now()
      WHERE id = workflow_id;
    END IF;
  END IF;
  
  RETURN p_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default system templates
INSERT INTO public.workflow_templates (name, description, category, building_type, template_data, steps, parameters, is_system_template) VALUES
('Residential Single Family Workflow', 'Standard workflow for single family residential projects', 'residential', 'single_family', 
 '{"default_compliance": ["IBC", "IRC"], "typical_duration": "12-16 weeks"}',
 '[
   {"name": "Initial Planning", "type": "planning", "automated": false, "duration": "1 week"},
   {"name": "Site Analysis", "type": "analysis", "automated": true, "duration": "2 days"},
   {"name": "Design Development", "type": "design", "automated": false, "duration": "3 weeks"},
   {"name": "Compliance Check", "type": "compliance", "automated": true, "duration": "1 day"},
   {"name": "Permit Submission", "type": "documentation", "automated": true, "duration": "1 day"},
   {"name": "Construction Documentation", "type": "documentation", "automated": false, "duration": "2 weeks"}
 ]',
 '[
   {"name": "lot_size", "type": "number", "required": true, "description": "Lot size in square feet"},
   {"name": "jurisdiction", "type": "string", "required": true, "description": "Local jurisdiction"},
   {"name": "zoning", "type": "string", "required": false, "description": "Zoning designation"}
 ]',
 true),
 
('Commercial Office Building Workflow', 'Standard workflow for commercial office buildings', 'commercial', 'office', 
 '{"default_compliance": ["IBC", "ADA"], "typical_duration": "20-26 weeks"}',
 '[
   {"name": "Project Initiation", "type": "planning", "automated": false, "duration": "2 weeks"},
   {"name": "Site Survey & Analysis", "type": "analysis", "automated": true, "duration": "1 week"},
   {"name": "Zoning Review", "type": "compliance", "automated": true, "duration": "3 days"},
   {"name": "Conceptual Design", "type": "design", "automated": false, "duration": "4 weeks"},
   {"name": "MEP Coordination", "type": "design", "automated": false, "duration": "2 weeks"},
   {"name": "Structural Analysis", "type": "analysis", "automated": true, "duration": "1 week"},
   {"name": "Code Compliance Review", "type": "compliance", "automated": true, "duration": "3 days"},
   {"name": "Permit Package Generation", "type": "documentation", "automated": true, "duration": "2 days"},
   {"name": "Construction Documents", "type": "documentation", "automated": false, "duration": "6 weeks"}
 ]',
 '[
   {"name": "building_area", "type": "number", "required": true, "description": "Total building area in square feet"},
   {"name": "occupancy_type", "type": "string", "required": true, "description": "Building occupancy classification"},
   {"name": "stories", "type": "number", "required": true, "description": "Number of stories"},
   {"name": "jurisdiction", "type": "string", "required": true, "description": "Local jurisdiction"}
 ]',
 true);

-- Insert default building type templates
INSERT INTO public.building_type_templates (name, building_type, category, description, default_parameters, required_compliance_checks, typical_materials, standard_elements) VALUES
('Single Family Residence', 'single_family', 'residential', 'Standard single family residential building template',
 '{"max_height": "35 feet", "setbacks": {"front": 25, "side": 10, "rear": 20}, "lot_coverage": 0.4}',
 '["IRC", "IBC", "NEC", "local_zoning"]',
 '["wood_frame", "concrete_foundation", "asphalt_shingles", "vinyl_siding"]',
 '["foundation", "floor_system", "wall_framing", "roof_system", "windows", "doors"]'),
 
('Multi-Family Residential', 'multi_family', 'residential', 'Multi-family residential building template',
 '{"max_height": "45 feet", "setbacks": {"front": 20, "side": 15, "rear": 25}, "lot_coverage": 0.6}',
 '["IBC", "NEC", "ADA", "local_zoning"]',
 '["concrete_block", "steel_frame", "membrane_roofing", "brick_veneer"]',
 '["foundation", "structural_system", "fire_separation", "egress_systems", "accessibility_features"]'),
 
('Commercial Office', 'office', 'commercial', 'Standard commercial office building template',
 '{"max_height": "unlimited", "setbacks": {"front": 15, "side": 10, "rear": 15}, "lot_coverage": 0.8}',
 '["IBC", "NEC", "ADA", "IECC", "local_zoning"]',
 '["steel_frame", "concrete", "curtain_wall", "metal_roofing"]',
 '["foundation", "structural_frame", "curtain_wall_system", "hvac_system", "elevator", "fire_protection"]');

-- Create triggers for audit logging
CREATE TRIGGER audit_workflow_templates AFTER INSERT OR UPDATE OR DELETE ON public.workflow_templates
  FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

CREATE TRIGGER audit_project_workflows AFTER INSERT OR UPDATE OR DELETE ON public.project_workflows
  FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_log();

-- Create update triggers
CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON public.workflow_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_workflows_updated_at BEFORE UPDATE ON public.project_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_building_type_templates_updated_at BEFORE UPDATE ON public.building_type_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
