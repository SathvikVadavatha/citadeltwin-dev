-- Update next_run_at for existing scheduled reports to ensure they run soon
-- This helps with immediate testing of the email functionality

-- Update any reports scheduled for today to run within the next few minutes if they haven't run yet
UPDATE public.scheduled_reports 
SET next_run_at = now() + interval '2 minutes'
WHERE is_active = true 
  AND (last_run_at IS NULL OR last_run_at < current_date)
  AND next_run_at > now() + interval '1 hour';

-- Create a simple function to help debug scheduling
CREATE OR REPLACE FUNCTION public.get_next_scheduled_reports()
RETURNS TABLE (
  id UUID,
  name TEXT,
  frequency TEXT,
  next_run_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  minutes_until_run NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    sr.name,
    sr.frequency,
    sr.next_run_at,
    sr.is_active,
    EXTRACT(EPOCH FROM (sr.next_run_at - now()))/60 as minutes_until_run
  FROM public.scheduled_reports sr
  WHERE sr.is_active = true
    AND sr.next_run_at > now()
  ORDER BY sr.next_run_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;