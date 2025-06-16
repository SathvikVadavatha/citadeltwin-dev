
-- Create enum types for cost estimation
CREATE TYPE public.cost_category AS ENUM (
  'material', 'labor', 'equipment', 'overhead', 'contingency'
);

CREATE TYPE public.estimation_status AS ENUM (
  'draft', 'in_progress', 'completed', 'approved', 'rejected'
);

CREATE TYPE public.cost_database_provider AS ENUM (
  'rs_means', 'craftsman', 'bni', 'custom'
);

-- Create cost estimation projects table
CREATE TABLE public.cost_estimations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status estimation_status NOT NULL DEFAULT 'draft',
  total_estimated_cost DECIMAL(15,2) DEFAULT 0,
  markup_percentage DECIMAL(5,2) DEFAULT 0,
  contingency_percentage DECIMAL(5,2) DEFAULT 10,
  estimated_duration_days INTEGER,
  labor_rate_per_hour DECIMAL(8,2) DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cost line items table
CREATE TABLE public.cost_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimation_id UUID NOT NULL REFERENCES public.cost_estimations(id) ON DELETE CASCADE,
  element_id UUID REFERENCES public.bim_elements(id) ON DELETE CASCADE,
  category cost_category NOT NULL,
  item_code TEXT,
  item_description TEXT NOT NULL,
  quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  unit_of_measure TEXT NOT NULL DEFAULT 'ea',
  unit_cost DECIMAL(10,4) NOT NULL DEFAULT 0,
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  labor_hours_per_unit DECIMAL(8,4) DEFAULT 0,
  total_labor_hours DECIMAL(10,2) GENERATED ALWAYS AS (quantity * labor_hours_per_unit) STORED,
  waste_factor DECIMAL(5,4) DEFAULT 0.05,
  notes TEXT,
  cost_database_source cost_database_provider DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cost databases table for industry pricing
CREATE TABLE public.cost_databases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider cost_database_provider NOT NULL,
  item_code TEXT NOT NULL,
  item_description TEXT NOT NULL,
  category cost_category NOT NULL,
  unit_of_measure TEXT NOT NULL,
  base_cost DECIMAL(10,4) NOT NULL,
  labor_hours_per_unit DECIMAL(8,4) DEFAULT 0,
  location_factor DECIMAL(5,4) DEFAULT 1.0,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider, item_code, effective_date)
);

-- Create project budgets table for tracking
CREATE TABLE public.project_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  estimation_id UUID REFERENCES public.cost_estimations(id) ON DELETE SET NULL,
  approved_budget DECIMAL(15,2) NOT NULL,
  contingency_budget DECIMAL(15,2) DEFAULT 0,
  spent_to_date DECIMAL(15,2) DEFAULT 0,
  remaining_budget DECIMAL(15,2) GENERATED ALWAYS AS (approved_budget + contingency_budget - spent_to_date) STORED,
  budget_status TEXT DEFAULT 'on_track',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quantity takeoff table for automated calculations
CREATE TABLE public.quantity_takeoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimation_id UUID NOT NULL REFERENCES public.cost_estimations(id) ON DELETE CASCADE,
  element_id UUID NOT NULL REFERENCES public.bim_elements(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  calculated_quantity DECIMAL(15,4) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  calculation_method TEXT,
  geometry_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cost_estimations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantity_takeoffs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view cost estimations for their projects" ON public.cost_estimations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = cost_estimations.project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create cost estimations for their projects" ON public.cost_estimations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = cost_estimations.project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update their cost estimations" ON public.cost_estimations FOR UPDATE USING (created_by = auth.uid());

-- Similar policies for other tables
CREATE POLICY "Users can view line items for their estimations" ON public.cost_line_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cost_estimations ce
    JOIN public.projects p ON ce.project_id = p.id
    WHERE ce.id = cost_line_items.estimation_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage line items for their estimations" ON public.cost_line_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.cost_estimations ce
    JOIN public.projects p ON ce.project_id = p.id
    WHERE ce.id = cost_line_items.estimation_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view cost databases" ON public.cost_databases FOR SELECT USING (true);

CREATE POLICY "Users can view budgets for their projects" ON public.project_budgets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_budgets.project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage budgets for their projects" ON public.project_budgets FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_budgets.project_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view takeoffs for their estimations" ON public.quantity_takeoffs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cost_estimations ce
    JOIN public.projects p ON ce.project_id = p.id
    WHERE ce.id = quantity_takeoffs.estimation_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage takeoffs for their estimations" ON public.quantity_takeoffs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.cost_estimations ce
    JOIN public.projects p ON ce.project_id = p.id
    WHERE ce.id = quantity_takeoffs.estimation_id AND p.owner_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_cost_estimations_project_id ON public.cost_estimations(project_id);
CREATE INDEX idx_cost_line_items_estimation_id ON public.cost_line_items(estimation_id);
CREATE INDEX idx_cost_line_items_element_id ON public.cost_line_items(element_id);
CREATE INDEX idx_cost_databases_provider_code ON public.cost_databases(provider, item_code);
CREATE INDEX idx_project_budgets_project_id ON public.project_budgets(project_id);
CREATE INDEX idx_quantity_takeoffs_estimation_id ON public.quantity_takeoffs(estimation_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_cost_estimations_updated_at 
  BEFORE UPDATE ON public.cost_estimations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_line_items_updated_at 
  BEFORE UPDATE ON public.cost_line_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_budgets_updated_at 
  BEFORE UPDATE ON public.project_budgets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quantity_takeoffs_updated_at 
  BEFORE UPDATE ON public.quantity_takeoffs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample cost database data
INSERT INTO public.cost_databases (provider, item_code, item_description, category, unit_of_measure, base_cost, labor_hours_per_unit, effective_date) VALUES
('rs_means', 'CON-001', 'Ready Mix Concrete 3000 PSI', 'material', 'cy', 125.00, 0.5, CURRENT_DATE),
('rs_means', 'STL-001', 'Structural Steel Wide Flange', 'material', 'lb', 2.85, 0.02, CURRENT_DATE),
('rs_means', 'LAB-001', 'General Construction Labor', 'labor', 'hr', 45.00, 1.0, CURRENT_DATE),
('rs_means', 'CON-002', 'Reinforcing Steel #4 Bar', 'material', 'lb', 1.25, 0.015, CURRENT_DATE),
('rs_means', 'EXC-001', 'Excavation and Fill', 'equipment', 'cy', 15.50, 0.1, CURRENT_DATE);
