
-- Create compliance rules table for storing building codes and regulations
CREATE TABLE public.compliance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jurisdiction TEXT NOT NULL, -- e.g., 'IBC 2021', 'California Building Code'
  code_section TEXT NOT NULL, -- e.g., '506.1', '504.3'
  rule_type TEXT NOT NULL CHECK (rule_type IN ('height_limit', 'area_limit', 'occupancy', 'egress', 'fire_rating', 'structural')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rule_logic JSONB NOT NULL, -- JSON structure defining the rule parameters
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance violations table for tracking violations found during checks
CREATE TABLE public.compliance_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.blueprint_uploads(id) ON DELETE CASCADE,
  element_id UUID REFERENCES public.bim_elements(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.compliance_rules(id) ON DELETE RESTRICT,
  violation_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'warning')),
  description TEXT NOT NULL,
  location JSONB, -- Coordinates or location info where violation occurs
  current_value JSONB, -- What was found (e.g., {"height": 80, "unit": "feet"})
  required_value JSONB, -- What should be (e.g., {"max_height": 75, "unit": "feet"})
  remediation_suggestions TEXT[], -- Array of suggested fixes
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create compliance checks table to track when compliance checks were run
CREATE TABLE public.compliance_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.blueprint_uploads(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL, -- 'manual', 'automatic', 'scheduled'
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  rules_checked INTEGER DEFAULT 0,
  violations_found INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_compliance_rules_jurisdiction ON public.compliance_rules(jurisdiction);
CREATE INDEX idx_compliance_rules_rule_type ON public.compliance_rules(rule_type);
CREATE INDEX idx_compliance_rules_active ON public.compliance_rules(is_active) WHERE is_active = true;

CREATE INDEX idx_compliance_violations_upload_id ON public.compliance_violations(upload_id);
CREATE INDEX idx_compliance_violations_element_id ON public.compliance_violations(element_id);
CREATE INDEX idx_compliance_violations_rule_id ON public.compliance_violations(rule_id);
CREATE INDEX idx_compliance_violations_status ON public.compliance_violations(status);
CREATE INDEX idx_compliance_violations_severity ON public.compliance_violations(severity);

CREATE INDEX idx_compliance_checks_upload_id ON public.compliance_checks(upload_id);
CREATE INDEX idx_compliance_checks_status ON public.compliance_checks(status);
CREATE INDEX idx_compliance_checks_user_id ON public.compliance_checks(user_id);

-- Add triggers to update the updated_at timestamp
CREATE TRIGGER update_compliance_rules_updated_at
  BEFORE UPDATE ON public.compliance_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some basic IBC 2021 rules to start with
INSERT INTO public.compliance_rules (jurisdiction, code_section, rule_type, title, description, rule_logic) VALUES
('IBC 2021', '506.1', 'area_limit', 'Allowable Area - General', 'Buildings shall not exceed the allowable area per story and aggregate area limits', '{
  "max_area_per_story": {"A-1": 15500, "A-2": 15500, "A-3": 15500, "A-4": 15500, "A-5": 0, "B": 37500, "E": 26500, "F-1": 25000, "F-2": 37500, "H-1": 16500, "H-2": 16500, "H-3": 60000, "H-4": 37500, "H-5": 37500, "I-1": 16500, "I-2": 15000, "I-3": 15000, "I-4": 26500, "M": 21500, "R-1": 24000, "R-2": 24000, "R-3": 0, "R-4": 16500, "S-1": 26000, "S-2": 39000, "U": 35500},
  "unit": "square_feet"
}'),

('IBC 2021', '506.2', 'area_limit', 'Allowable Area - Frontage Increase', 'Area may be increased based on frontage', '{
  "frontage_increase_factor": 0.75,
  "perimeter_factor": 0.25,
  "max_increase": 0.75
}'),

('IBC 2021', '504.3', 'height_limit', 'Height Limitations - General', 'Buildings shall not exceed the height limits in feet and stories', '{
  "max_height_feet": {"A-1": 180, "A-2": 180, "A-3": 180, "A-4": 180, "A-5": 180, "B": 180, "E": 180, "F-1": 180, "F-2": 180, "H-1": 75, "H-2": 75, "H-3": 180, "H-4": 180, "H-5": 180, "I-1": 180, "I-2": 180, "I-3": 180, "I-4": 180, "M": 180, "R-1": 180, "R-2": 180, "R-3": 180, "R-4": 180, "S-1": 180, "S-2": 180, "U": 180},
  "max_stories": {"A-1": 5, "A-2": 5, "A-3": 5, "A-4": 5, "A-5": 5, "B": 5, "E": 5, "F-1": 5, "F-2": 5, "H-1": 3, "H-2": 3, "H-3": 5, "H-4": 5, "H-5": 5, "I-1": 5, "I-2": 4, "I-3": 5, "I-4": 5, "M": 5, "R-1": 5, "R-2": 5, "R-3": 5, "R-4": 5, "S-1": 5, "S-2": 5, "U": 5}
}'),

('IBC 2021', '1006.2.1', 'egress', 'Egress Width - Minimum', 'Exit access shall be not less than 44 inches wide', '{
  "min_width_inches": 44,
  "exceptions": {"dwelling_units": 36, "access_to_equipment": 24}
}'),

('IBC 2021', '1015.1', 'egress', 'Exit Access Travel Distance', 'Maximum travel distance to an exit', '{
  "max_travel_distance_feet": {"A-1": 200, "A-2": 200, "A-3": 200, "A-4": 200, "A-5": 200, "B": 200, "E": 200, "F-1": 200, "F-2": 300, "H-1": 75, "H-2": 75, "H-3": 200, "H-4": 200, "H-5": 200, "I-1": 200, "I-2": 200, "I-3": 200, "I-4": 200, "M": 200, "R-1": 200, "R-2": 200, "R-3": 200, "R-4": 200, "S-1": 200, "S-2": 300, "U": 200},
  "sprinkler_increase_factor": 1.5
}');
