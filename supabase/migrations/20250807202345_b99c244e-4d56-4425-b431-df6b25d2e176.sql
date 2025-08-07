-- Add unique constraint for layer_name to support upserts
ALTER TABLE gis_layers ADD CONSTRAINT gis_layers_layer_name_unique UNIQUE (layer_name);

-- Add protected_lands as a valid layer_type
ALTER TABLE gis_layers DROP CONSTRAINT gis_layers_layer_type_check;
ALTER TABLE gis_layers ADD CONSTRAINT gis_layers_layer_type_check 
  CHECK (layer_type = ANY (ARRAY['parcels'::text, 'roads'::text, 'utilities'::text, 'flood_zones'::text, 'soil_conditions'::text, 'zoning'::text, 'environmental'::text, 'boundaries'::text, 'protected_lands'::text]));