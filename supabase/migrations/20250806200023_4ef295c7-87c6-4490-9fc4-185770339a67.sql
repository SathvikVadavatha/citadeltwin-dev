-- Create scheduled cron job to refresh protected areas data every 2 weeks
SELECT cron.schedule(
  'refresh-protected-areas-data',
  '0 2 * * 0', -- Every Sunday at 2 AM (weekly, but we'll make it bi-weekly in logic)
  $$
  SELECT
    net.http_post(
        url:='https://fjybggorcizszcpedjbb.supabase.co/functions/v1/real-gis-integration',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeWJnZ29yY2l6c3pjcGVkamJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNzI1OTcsImV4cCI6MjA2NDc0ODU5N30.F1HJAd4c6y1Nb_9u-_ZsTFCukiTyr-3BjS8vngMVwgM"}'::jsonb,
        body:='{"action": "scheduled_refresh", "data_types": ["protected_lands"]}'::jsonb
    ) as request_id;
  $$
);