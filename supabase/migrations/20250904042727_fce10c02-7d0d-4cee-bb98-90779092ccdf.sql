-- Fix calculate_next_run_at to allow same-day scheduling and add trigger to auto-compute next_run_at
-- Enable required extensions (idempotent)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Recreate function with improved logic
create or replace function public.calculate_next_run_at(
  frequency text,
  schedule_config jsonb,
  last_run timestamptz default null
) returns timestamptz
language plpgsql
security definer
set search_path to public
as $$
DECLARE
  -- Work with local time in the specified timezone
  timezone_val text := coalesce(schedule_config->>'timezone', 'UTC');
  hour_val int := coalesce((schedule_config->>'hour')::int, 9);
  minute_val int := coalesce((schedule_config->>'minute')::int, 0);
  day_of_week int := coalesce((schedule_config->>'day_of_week')::int, 1); -- 1=Mon .. 7=Sun (isodow)
  day_of_month int := coalesce((schedule_config->>'day_of_month')::int, 1);

  base_local timestamp;      -- now/last_run expressed in the target timezone (no tz)
  next_local timestamp;      -- next run in local time (no tz)
  week_start timestamp;      -- start of ISO week in local time
  target_dom int;            -- clamped day of month
  month_start timestamp;
  days_in_month int;
  base_isodow int;
BEGIN
  -- Establish base time in local timezone (either last_run or now)
  base_local := (coalesce(last_run, now())) AT TIME ZONE timezone_val;

  IF frequency = 'daily' THEN
    next_local := date_trunc('day', base_local) + make_interval(hours => hour_val, mins => minute_val);
    IF next_local < base_local THEN
      next_local := next_local + interval '1 day';
    END IF;

  ELSIF frequency = 'weekly' THEN
    -- ISO weeks start Monday; compute start of week accordingly
    base_isodow := extract(isodow from base_local); -- 1..7
    -- start of ISO week (Monday)
    week_start := date_trunc('week', base_local);
    -- schedule for the configured iso day (1..7)
    next_local := week_start + (day_of_week - 1) * interval '1 day'
                   + make_interval(hours => hour_val, mins => minute_val);
    IF next_local < base_local THEN
      next_local := next_local + interval '7 days';
    END IF;

  ELSIF frequency = 'monthly' THEN
    month_start := date_trunc('month', base_local);
    -- clamp day_of_month to last day of current month
    days_in_month := extract(day from (month_start + interval '1 month' - interval '1 day'))::int;
    target_dom := LEAST(GREATEST(day_of_month, 1), days_in_month);
    next_local := month_start + (target_dom - 1) * interval '1 day'
                  + make_interval(hours => hour_val, mins => minute_val);
    IF next_local < base_local THEN
      -- compute next month with clamping again
      month_start := date_trunc('month', base_local + interval '1 month');
      days_in_month := extract(day from (month_start + interval '1 month' - interval '1 day'))::int;
      target_dom := LEAST(GREATEST(day_of_month, 1), days_in_month);
      next_local := month_start + (target_dom - 1) * interval '1 day'
                    + make_interval(hours => hour_val, mins => minute_val);
    END IF;
  ELSE
    -- default safety: schedule next day at configured time
    next_local := date_trunc('day', base_local) + interval '1 day'
                  + make_interval(hours => hour_val, mins => minute_val);
  END IF;

  -- Convert the computed local timestamp back to UTC timestamptz
  RETURN next_local AT TIME ZONE timezone_val;
END;
$$;

-- Create trigger to auto-calculate next_run_at on insert/update of schedule or config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_scheduled_reports_next_run'
  ) THEN
    CREATE TRIGGER trg_scheduled_reports_next_run
    BEFORE INSERT OR UPDATE OF frequency, schedule_config
    ON public.scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_scheduled_report_next_run();
  END IF;
END $$;

-- Helpful index to speed up scheduler lookups
create index if not exists idx_scheduled_reports_due on public.scheduled_reports (is_active, next_run_at);
