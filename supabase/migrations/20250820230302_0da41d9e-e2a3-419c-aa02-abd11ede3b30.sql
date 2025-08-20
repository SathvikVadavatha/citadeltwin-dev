-- Fix security issues by updating function search paths
CREATE OR REPLACE FUNCTION public.calculate_next_run_at(
  frequency TEXT,
  schedule_config JSONB,
  last_run TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_run TIMESTAMP WITH TIME ZONE;
  base_time TIMESTAMP WITH TIME ZONE;
  hour_val INTEGER;
  minute_val INTEGER;
  day_of_week INTEGER;
  day_of_month INTEGER;
  timezone_val TEXT;
BEGIN
  -- Get schedule configuration
  hour_val := COALESCE((schedule_config->>'hour')::INTEGER, 9);
  minute_val := COALESCE((schedule_config->>'minute')::INTEGER, 0);
  timezone_val := COALESCE(schedule_config->>'timezone', 'UTC');
  
  -- Set base time to now in the specified timezone
  base_time := now() AT TIME ZONE timezone_val;
  
  -- If we have a last run, start from there
  IF last_run IS NOT NULL THEN
    base_time := last_run AT TIME ZONE timezone_val;
  END IF;
  
  CASE frequency
    WHEN 'daily' THEN
      next_run := (base_time + INTERVAL '1 day')::DATE + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
      
    WHEN 'weekly' THEN
      day_of_week := COALESCE((schedule_config->>'day_of_week')::INTEGER, 1); -- Monday = 1
      next_run := base_time + INTERVAL '1 week';
      next_run := next_run - (EXTRACT(DOW FROM next_run)::INTEGER - day_of_week) * INTERVAL '1 day';
      next_run := next_run::DATE + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
      
    WHEN 'monthly' THEN
      day_of_month := COALESCE((schedule_config->>'day_of_month')::INTEGER, 1);
      next_run := (base_time + INTERVAL '1 month')::DATE;
      next_run := DATE_TRUNC('month', next_run) + (day_of_month - 1 || ' days')::INTERVAL;
      next_run := next_run + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
  END CASE;
  
  -- Convert back to UTC
  RETURN next_run AT TIME ZONE timezone_val;
END;
$$;

-- Update trigger function with search path
CREATE OR REPLACE FUNCTION public.update_scheduled_report_next_run()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.frequency != NEW.frequency OR OLD.schedule_config != NEW.schedule_config)) THEN
    NEW.next_run_at := public.calculate_next_run_at(NEW.frequency, NEW.schedule_config, NEW.last_run_at);
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Update complete_report_delivery function with search path  
CREATE OR REPLACE FUNCTION public.complete_report_delivery(
  delivery_id UUID,
  delivery_status TEXT,
  file_path_val TEXT DEFAULT NULL,
  error_msg TEXT DEFAULT NULL,
  recipients_sent_val JSONB DEFAULT NULL,
  execution_time INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.scheduled_report_deliveries 
  SET 
    status = delivery_status,
    delivered_at = CASE WHEN delivery_status = 'sent' THEN now() ELSE delivered_at END,
    file_path = COALESCE(file_path_val, file_path),
    error_message = error_msg,
    recipients_sent = COALESCE(recipients_sent_val, recipients_sent),
    execution_time_ms = COALESCE(execution_time, execution_time_ms)
  WHERE id = delivery_id;
  
  -- Update the scheduled report's last_run_at if successful
  IF delivery_status = 'sent' THEN
    UPDATE public.scheduled_reports 
    SET last_run_at = now(),
        next_run_at = public.calculate_next_run_at(frequency, schedule_config, now())
    WHERE id = (
      SELECT scheduled_report_id 
      FROM public.scheduled_report_deliveries 
      WHERE id = delivery_id
    );
  END IF;
END;
$$;