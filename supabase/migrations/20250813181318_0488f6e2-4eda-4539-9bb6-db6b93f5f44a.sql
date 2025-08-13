-- Clean up gis_layers table to keep only Florida and Ohio data
DELETE FROM gis_layers 
WHERE state NOT IN ('FL', 'OH', 'Florida', 'Ohio');