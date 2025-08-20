-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run report scheduler every hour
SELECT cron.schedule(
  'scheduled-reports-runner',
  '0 * * * *', -- Run every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://fjybggorcizszcpedjbb.supabase.co/functions/v1/report-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeWJnZ29yY2l6c3pjcGVkamJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNzI1OTcsImV4cCI6MjA2NDc0ODU5N30.F1HJAd4c6y1Nb_9u-_ZsTFCukiTyr-3BjS8vngMVwgM"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) as request_id;
  $$
);