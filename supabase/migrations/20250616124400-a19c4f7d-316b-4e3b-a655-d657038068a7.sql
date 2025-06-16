
-- Create jurisdictions table for multi-jurisdiction compliance
CREATE TABLE public.jurisdictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('state', 'county', 'city', 'federal')),
  state_code TEXT NOT NULL,
  county_name TEXT,
  city_name TEXT,
  parent_jurisdiction_id UUID REFERENCES public.jurisdictions(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  contact_info JSONB,
  website_url TEXT,
  code_adoption_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jurisdiction_codes table for code versions
CREATE TABLE public.jurisdiction_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jurisdiction_id UUID NOT NULL REFERENCES public.jurisdictions(id) ON DELETE CASCADE,
  code_type TEXT NOT NULL,
  code_name TEXT NOT NULL,
  code_version TEXT NOT NULL,
  adoption_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  amendments JSONB,
  is_current BOOLEAN NOT NULL DEFAULT true,
  superseded_by UUID REFERENCES public.jurisdiction_codes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_jurisdictions_state_code ON public.jurisdictions(state_code);
CREATE INDEX idx_jurisdictions_type ON public.jurisdictions(jurisdiction_type);
CREATE INDEX idx_jurisdictions_active ON public.jurisdictions(is_active);
CREATE INDEX idx_jurisdiction_codes_jurisdiction_id ON public.jurisdiction_codes(jurisdiction_id);
CREATE INDEX idx_jurisdiction_codes_current ON public.jurisdiction_codes(is_current);

-- Insert sample jurisdiction data
INSERT INTO public.jurisdictions (name, jurisdiction_type, state_code, county_name, city_name) VALUES
('New York', 'state', 'NY', NULL, NULL),
('California', 'state', 'CA', NULL, NULL),
('Texas', 'state', 'TX', NULL, NULL),
('Ohio', 'state', 'OH', NULL, NULL),
('Florida', 'state', 'FL', NULL, NULL),
('New York County', 'county', 'NY', 'New York', NULL),
('Los Angeles County', 'county', 'CA', 'Los Angeles', NULL),
('Harris County', 'county', 'TX', 'Harris', NULL),
('Cuyahoga County', 'county', 'OH', 'Cuyahoga', NULL),
('Miami-Dade County', 'county', 'FL', 'Miami-Dade', NULL),
('New York City', 'city', 'NY', 'New York', 'New York City'),
('Los Angeles', 'city', 'CA', 'Los Angeles', 'Los Angeles'),
('Houston', 'city', 'TX', 'Harris', 'Houston'),
('Cleveland', 'city', 'OH', 'Cuyahoga', 'Cleveland'),
('Miami', 'city', 'FL', 'Miami-Dade', 'Miami');

-- Insert sample jurisdiction codes
INSERT INTO public.jurisdiction_codes (jurisdiction_id, code_type, code_name, code_version, adoption_date, effective_date) 
SELECT 
  j.id,
  'building_code',
  CASE 
    WHEN j.name = 'New York City' THEN 'NYC Building Code'
    WHEN j.state_code = 'CA' THEN 'California Building Code (CBC)'
    WHEN j.state_code = 'TX' THEN 'Texas Building Code'
    WHEN j.state_code = 'OH' THEN 'Ohio Building Code (OBC)'
    WHEN j.state_code = 'FL' THEN 'Florida Building Code (FBC)'
    ELSE 'International Building Code (IBC)'
  END,
  '2021',
  '2021-01-01',
  '2021-01-01'
FROM public.jurisdictions j;
