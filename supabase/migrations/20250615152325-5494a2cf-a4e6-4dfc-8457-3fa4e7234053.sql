
-- Create enum types for BIM model elements
CREATE TYPE public.element_type AS ENUM (
  'wall', 'beam', 'column', 'slab', 'door', 'window', 
  'roof', 'foundation', 'stair', 'railing', 'mechanical', 
  'electrical', 'plumbing', 'structural', 'architectural'
);

CREATE TYPE public.material_type AS ENUM (
  'concrete', 'steel', 'wood', 'glass', 'aluminum', 
  'brick', 'stone', 'composite', 'insulation', 'drywall'
);

CREATE TYPE public.constraint_type AS ENUM (
  'dimensional', 'geometric', 'material', 'structural', 'thermal'
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  material_type material_type NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}', -- density, strength, thermal properties, etc.
  cost_per_unit DECIMAL(10,2),
  unit TEXT DEFAULT 'm3', -- cubic meter, square meter, etc.
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create BIM model elements table
CREATE TABLE public.bim_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.blueprint_uploads(id) ON DELETE CASCADE,
  element_type element_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  geometry JSONB NOT NULL, -- 3D geometry data, coordinates, dimensions
  parameters JSONB NOT NULL DEFAULT '{}', -- parametric properties
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  parent_element_id UUID REFERENCES public.bim_elements(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create constraints table for parametric relationships
CREATE TABLE public.element_constraints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  element_id UUID REFERENCES public.bim_elements(id) ON DELETE CASCADE NOT NULL,
  constraint_type constraint_type NOT NULL,
  constraint_data JSONB NOT NULL, -- constraint rules and parameters
  target_element_id UUID REFERENCES public.bim_elements(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create model assemblies table for grouping elements
CREATE TABLE public.model_assemblies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.blueprint_uploads(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  assembly_type TEXT NOT NULL, -- floor, building, zone, etc.
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for assembly-element relationships
CREATE TABLE public.assembly_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id UUID REFERENCES public.model_assemblies(id) ON DELETE CASCADE NOT NULL,
  element_id UUID REFERENCES public.bim_elements(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(assembly_id, element_id)
);

-- Enable RLS on all tables
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bim_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.element_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_elements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for materials (shared resource, readable by all)
CREATE POLICY "Anyone can view materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create materials" ON public.materials FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update materials they created" ON public.materials FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for BIM elements (access through upload ownership)
CREATE POLICY "Users can view BIM elements for their uploads" ON public.bim_elements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.blueprint_uploads 
    WHERE id = bim_elements.upload_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create BIM elements for their uploads" ON public.bim_elements FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.blueprint_uploads 
    WHERE id = bim_elements.upload_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update BIM elements for their uploads" ON public.bim_elements FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.blueprint_uploads 
    WHERE id = bim_elements.upload_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete BIM elements for their uploads" ON public.bim_elements FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.blueprint_uploads 
    WHERE id = bim_elements.upload_id AND user_id = auth.uid()
  )
);

-- Similar policies for constraints, assemblies, and assembly_elements
CREATE POLICY "Users can view constraints for their elements" ON public.element_constraints FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bim_elements be
    JOIN public.blueprint_uploads bu ON be.upload_id = bu.id
    WHERE be.id = element_constraints.element_id AND bu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage constraints for their elements" ON public.element_constraints FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.bim_elements be
    JOIN public.blueprint_uploads bu ON be.upload_id = bu.id
    WHERE be.id = element_constraints.element_id AND bu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view assemblies for their uploads" ON public.model_assemblies FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.blueprint_uploads 
    WHERE id = model_assemblies.upload_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage assemblies for their uploads" ON public.model_assemblies FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.blueprint_uploads 
    WHERE id = model_assemblies.upload_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage assembly elements" ON public.assembly_elements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.model_assemblies ma
    JOIN public.blueprint_uploads bu ON ma.upload_id = bu.id
    WHERE ma.id = assembly_elements.assembly_id AND bu.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_bim_elements_upload_id ON public.bim_elements(upload_id);
CREATE INDEX idx_bim_elements_type ON public.bim_elements(element_type);
CREATE INDEX idx_bim_elements_parent ON public.bim_elements(parent_element_id);
CREATE INDEX idx_element_constraints_element_id ON public.element_constraints(element_id);
CREATE INDEX idx_materials_type ON public.materials(material_type);

-- Add trigger for updated_at timestamps
CREATE TRIGGER update_materials_updated_at 
  BEFORE UPDATE ON public.materials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bim_elements_updated_at 
  BEFORE UPDATE ON public.bim_elements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_assemblies_updated_at 
  BEFORE UPDATE ON public.model_assemblies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
