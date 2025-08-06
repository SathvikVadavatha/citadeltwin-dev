-- Clean up existing protected lands records
DELETE FROM gis_layers WHERE layer_type = 'environmental' AND environmental_type = 'protected_lands';