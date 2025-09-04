-- Clean up legacy data and normalize environmental types
-- 1. Update soil_conditions to soils
UPDATE gis_layers 
SET environmental_type = 'soils'
WHERE environmental_type = 'soil_conditions';

-- 2. Remove CA data that's not needed (utilities data from Los Angeles)
DELETE FROM gis_layers 
WHERE state = 'CA' AND city = 'Los Angeles' AND layer_type = 'utilities';

-- 3. Clean up any other unneeded entries with NULL environmental_type for non-environmental layers
DELETE FROM gis_layers 
WHERE environmental_type IS NULL AND layer_type != 'environmental';