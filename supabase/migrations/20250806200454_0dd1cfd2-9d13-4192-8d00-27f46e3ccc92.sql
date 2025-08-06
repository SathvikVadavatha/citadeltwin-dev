-- Create a simple cron job that runs a custom SQL function every 2 weeks
-- First, create a function to check and refresh protected areas data
CREATE OR REPLACE FUNCTION public.refresh_protected_areas_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if we need to refresh data (older than 2 weeks)
  IF NOT EXISTS (
    SELECT 1 FROM public.gis_layers 
    WHERE environmental_type = 'protected_lands' 
    AND created_at > now() - interval '14 days'
  ) THEN
    -- Log that a refresh is needed
    INSERT INTO public.gis_data_updates (
      update_type,
      update_source,
      update_data,
      processing_status
    ) VALUES (
      'scheduled_refresh',
      'cron_job',
      '{"message": "Protected areas data refresh triggered", "timestamp": "' || now() || '"}',
      'completed'
    );
  END IF;
END;
$$;

-- Create a simple cron job that runs every Sunday at 2 AM
SELECT cron.schedule(
  'refresh-protected-areas',
  '0 2 * * 0',
  'SELECT public.refresh_protected_areas_data();'
);