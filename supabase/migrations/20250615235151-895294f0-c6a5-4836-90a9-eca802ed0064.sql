
-- Add environmental data support and improve GIS schema
ALTER TABLE public.gis_layers 
ADD COLUMN IF NOT EXISTS environmental_type TEXT,
ADD COLUMN IF NOT EXISTS update_frequency TEXT DEFAULT 'static',
ADD COLUMN IF NOT EXISTS real_time_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_freshness_hours INTEGER DEFAULT 24;

-- Create index for environmental data queries
CREATE INDEX IF NOT EXISTS idx_gis_layers_environmental_type ON public.gis_layers(environmental_type) WHERE environmental_type IS NOT NULL;

-- Create index for real-time enabled layers
CREATE INDEX IF NOT EXISTS idx_gis_layers_realtime ON public.gis_layers(real_time_enabled) WHERE real_time_enabled = true;

-- Add new layer types for environmental and zoning data
ALTER TABLE public.gis_layers 
DROP CONSTRAINT IF EXISTS gis_layers_layer_type_check;

ALTER TABLE public.gis_layers 
ADD CONSTRAINT gis_layers_layer_type_check 
CHECK (layer_type IN ('parcels', 'roads', 'utilities', 'flood_zones', 'soil_conditions', 'zoning', 'environmental', 'boundaries'));

-- Create table for real-time data updates tracking
CREATE TABLE IF NOT EXISTS public.gis_data_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layer_id UUID REFERENCES public.gis_layers(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL,
  update_source TEXT NOT NULL,
  update_data JSONB NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient querying
CREATE INDEX idx_gis_data_updates_layer_id ON public.gis_data_updates(layer_id);
CREATE INDEX idx_gis_data_updates_status ON public.gis_data_updates(processing_status);
CREATE INDEX idx_gis_data_updates_created_at ON public.gis_data_updates(created_at);

-- Improve spatial analysis results indexing
CREATE INDEX IF NOT EXISTS idx_spatial_analysis_results_analysis_type ON public.spatial_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_spatial_analysis_results_user_created ON public.spatial_analysis_results(user_id, created_at);

-- Add property boundary specific table
CREATE TABLE IF NOT EXISTS public.property_boundaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id TEXT NOT NULL,
  property_address TEXT,
  owner_name TEXT,
  boundary_geometry JSONB NOT NULL,
  area_sqft DECIMAL,
  zoning_designation TEXT,
  flood_zone TEXT,
  soil_type TEXT,
  environmental_constraints JSONB DEFAULT '[]'::jsonb,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  county TEXT,
  last_surveyed DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for property boundaries
CREATE INDEX idx_property_boundaries_parcel_id ON public.property_boundaries(parcel_id);
CREATE INDEX idx_property_boundaries_location ON public.property_boundaries(city, state);
CREATE INDEX idx_property_boundaries_zoning ON public.property_boundaries(zoning_designation) WHERE zoning_designation IS NOT NULL;
CREATE INDEX idx_property_boundaries_flood_zone ON public.property_boundaries(flood_zone) WHERE flood_zone IS NOT NULL;

-- Enable RLS on new tables
ALTER TABLE public.gis_data_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_boundaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gis_data_updates (admin/system access)
CREATE POLICY "Allow read access to gis_data_updates" ON public.gis_data_updates FOR SELECT USING (true);

-- Create RLS policies for property_boundaries (public read access for basic property info)
CREATE POLICY "Allow read access to property_boundaries" ON public.property_boundaries FOR SELECT USING (true);

-- Add trigger for updated_at on property_boundaries
CREATE TRIGGER update_property_boundaries_updated_at
  BEFORE UPDATE ON public.property_boundaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
