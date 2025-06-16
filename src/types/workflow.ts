
export interface WorkflowStep {
  name: string;
  type: 'planning' | 'analysis' | 'design' | 'compliance' | 'documentation' | 'review';
  automated: boolean;
  duration: string;
  description?: string;
  dependencies?: string[];
  required_inputs?: string[];
  outputs?: string[];
}

export interface WorkflowParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  description: string;
  default_value?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'residential' | 'commercial' | 'industrial' | 'infrastructure';
  building_type?: string;
  template_data: Record<string, any>;
  steps: WorkflowStep[];
  automation_rules: Record<string, any>;
  parameters: WorkflowParameter[];
  is_active: boolean;
  is_system_template: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWorkflow {
  id: string;
  project_id?: string;
  template_id?: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  current_step: number;
  steps: WorkflowStep[];
  automation_config: Record<string, any>;
  progress_data: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  step_index: number;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface BuildingTypeTemplate {
  id: string;
  name: string;
  building_type: string;
  category: string;
  description?: string;
  default_parameters: Record<string, any>;
  required_compliance_checks: string[];
  typical_materials: string[];
  standard_elements: string[];
  design_requirements: Record<string, any>;
  code_requirements: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AutomatedProjectSetup {
  id: string;
  project_id?: string;
  template_id?: string;
  setup_parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress_percentage: number;
  steps_completed: string[];
  error_logs: string[];
  created_by?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface WorkflowTrigger {
  id: string;
  workflow_id: string;
  trigger_type: 'manual' | 'time_based' | 'event_based' | 'condition_based';
  trigger_config: Record<string, any>;
  is_active: boolean;
  last_triggered?: string;
  created_at: string;
}
