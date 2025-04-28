
-- Enable the pg_cron and pg_net extensions if they're not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing schedule first
SELECT cron.unschedule('check-prep-watch-rules-every-5-minutes');

-- Schedule a job to run every minute to check PrepWatch rules
SELECT cron.schedule(
  'check-prep-watch-rules-every-5-minutes',  -- job name
  '* * * * *',                            -- run every minute (for testing)
  $$
  SELECT
    net.http_post(
      url:='https://htrstvloqgqvnvtiqfwa.functions.supabase.co/functions/v1/check-prep-watch-rules',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cnN0dmxvcWdxdm52dGlxZndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NjU2ODcsImV4cCI6MjA1ODU0MTY4N30.R4cxC3z5aCUGYZIQWgMs2hoYrUHKYC3U89KXNbYmyHw"}'::jsonb,
      body:='{"forceRun": true}'::jsonb
    ) as request_id;
  $$
);

-- Add a view to check the cron jobs status
CREATE OR REPLACE VIEW job_status AS
SELECT 
  jobid,
  jobname,
  schedule,
  last_run,
  next_run,
  status
FROM cron.job;
