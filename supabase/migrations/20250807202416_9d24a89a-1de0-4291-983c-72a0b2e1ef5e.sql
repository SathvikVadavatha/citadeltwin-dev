-- Fix security warnings by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.refresh_protected_areas_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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