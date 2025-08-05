-- Enable RLS for gis_layers table and add proper policies
ALTER TABLE gis_layers ENABLE ROW LEVEL SECURITY;

-- Policy for viewing GIS layers - allow all authenticated users to view
CREATE POLICY "Users can view GIS layers" ON gis_layers
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy for creating GIS layers - allow authenticated users to create
CREATE POLICY "Users can create GIS layers" ON gis_layers  
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating GIS layers - allow authenticated users to update
CREATE POLICY "Users can update GIS layers" ON gis_layers
FOR UPDATE  
USING (auth.role() = 'authenticated');

-- Insert sample FEMA flood data for testing
INSERT INTO gis_layers (
  layer_name, 
  layer_type, 
  environmental_type,
  description,
  source_url,
  city, 
  state, 
  geometry_data, 
  feature_count, 
  real_time_enabled, 
  data_freshness_hours,
  metadata,
  coordinate_system,
  processing_status
) VALUES 
(
  'FEMA_Flood_Zones_Orange_County_FL',
  'flood_zones',
  'flood_zones', 
  'Official FEMA flood zones for Orange County, FL',
  'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer',
  'Orlando',
  'FL',
  '{"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"FLD_ZONE": "AE", "SFHA_TF": "T", "risk_level": "HIGH", "zone_description": "Special Flood Hazard Area with base flood elevations determined"}, "geometry": {"type": "Polygon", "coordinates": [[[-81.4, 28.5], [-81.3, 28.5], [-81.3, 28.6], [-81.4, 28.6], [-81.4, 28.5]]]}}], "metadata": {"source": "FEMA NFHL", "total_zones": 15, "high_risk_zones": 8}}',
  15,
  true,
  24,
  '{"source": "FEMA NFHL", "county_fips": "12095", "county_name": "Orange County, FL", "accuracy": "official", "data_provider": "Federal Emergency Management Agency", "total_zones": 15, "high_risk_zones": 8}',
  'EPSG:4326',
  'ready'
),
(
  'FEMA_Flood_Zones_Cuyahoga_County_OH',
  'flood_zones',
  'flood_zones', 
  'Official FEMA flood zones for Cuyahoga County, OH',
  'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer',
  'Cleveland',
  'OH',
  '{"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"FLD_ZONE": "X", "SFHA_TF": "F", "risk_level": "MODERATE", "zone_description": "Areas of minimal flood hazard"}, "geometry": {"type": "Polygon", "coordinates": [[[-81.7, 41.4], [-81.6, 41.4], [-81.6, 41.5], [-81.7, 41.5], [-81.7, 41.4]]]}}], "metadata": {"source": "FEMA NFHL", "total_zones": 8, "high_risk_zones": 2}}',
  8,
  true,
  24,
  '{"source": "FEMA NFHL", "county_fips": "39035", "county_name": "Cuyahoga County, OH", "accuracy": "official", "data_provider": "Federal Emergency Management Agency", "total_zones": 8, "high_risk_zones": 2}',
  'EPSG:4326',
  'ready'
);