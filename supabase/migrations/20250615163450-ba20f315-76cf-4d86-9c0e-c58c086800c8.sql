
-- Create GIS layers table for storing municipal spatial data
CREATE TABLE public.gis_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layer_name TEXT NOT NULL,
  layer_type TEXT NOT NULL CHECK (layer_type IN ('parcels', 'roads', 'utilities')),
  description TEXT,
  source_url TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  geometry_data JSONB,
  feature_count INTEGER DEFAULT 0,
  data_size BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'updating')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on layer_type for efficient filtering
CREATE INDEX idx_gis_layers_type ON public.gis_layers(layer_type);

-- Create index on city and state for location-based queries
CREATE INDEX idx_gis_layers_location ON public.gis_layers(city, state);

-- Create index on status for filtering active layers
CREATE INDEX idx_gis_layers_status ON public.gis_layers(status);

-- Add trigger to update the last_updated timestamp
CREATE TRIGGER update_gis_layers_updated_at
  BEFORE UPDATE ON public.gis_layers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
