-- Update cron job to run every minute instead of hourly
-- First, unschedule the existing job if it exists
SELECT cron.unschedule('report-scheduler-hourly');

-- Create new cron job that runs every minute
SELECT cron.schedule(
  'report-scheduler-minutely',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://fjybggorcizszcpedjbb.supabase.co/functions/v1/report-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeWJnZ29yY2l6c3pjcGVkamJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNzI1OTcsImV4cCI6MjA2NDc0ODU5N30.F1HJAd4c6y1Nb_9u-_ZsTFCukiTyr-3BjS8vngMVwgM"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);