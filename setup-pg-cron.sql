
-- Enable the pg_cron and pg_net extensions if they're not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing schedule first
SELECT cron.unschedule('check-prep-watch-rules-every-5-minutes');

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

-- Create a trigger function to check PrepWatch rules and create notifications
CREATE OR REPLACE FUNCTION public.check_prep_watch_rules()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule RECORD;
  active_count INTEGER;
  current_hour INTEGER;
  current_minute INTEGER;
  current_day INTEGER; -- 0 = Sunday, 6 = Saturday
  should_check BOOLEAN;
BEGIN
  -- Log execution start
  RAISE NOTICE 'Running PrepWatch check at %', now();
  
  -- Get current time components
  current_hour := EXTRACT(hour FROM now());
  current_minute := EXTRACT(minute FROM now());
  current_day := EXTRACT(dow FROM now()); -- 0 = Sunday, 6 = Saturday
  
  -- Process each rule
  FOR rule IN 
    SELECT * FROM prep_watch_settings
  LOOP
    should_check := false;
    
    -- Check if we should process this rule based on frequency and schedule
    IF rule.frequency = 'daily' THEN
      -- For daily frequency, check if current time matches the scheduled time
      IF current_hour = rule.check_hour AND current_minute = rule.check_minute THEN
        should_check := true;
      END IF;
    ELSIF rule.frequency = 'weekly' THEN
      -- For weekly frequency, check if current day and time match the scheduled day and time
      IF current_day = rule.check_day AND current_hour = rule.check_hour AND current_minute = rule.check_minute THEN
        should_check := true;
      END IF;
    END IF;
    
    -- Only proceed if this is the scheduled time for this rule
    IF should_check THEN
      -- Get active inventory items for this food type
      SELECT COUNT(*) INTO active_count
      FROM inventory
      WHERE restaurant_id = rule.restaurant_id
        AND product = rule.food_type
        AND status = 'active';
      
      RAISE NOTICE 'Checking % (current count: %, minimum: %)', 
        rule.food_type, active_count, rule.minimum_count;
        
      -- Create notification if count is below minimum
      IF active_count < rule.minimum_count THEN
        RAISE NOTICE 'Creating notification for %', rule.food_type;
        
        INSERT INTO notifications (
          restaurant_id, 
          title, 
          message, 
          type, 
          read, 
          link
        ) VALUES (
          rule.restaurant_id,
          'Low Inventory Alert: ' || rule.food_type,
          rule.food_type || ' count (' || active_count || ') is below the minimum requirement of ' || rule.minimum_count,
          'warning',
          false,
          '/admin'
        );
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'PrepWatch check completed at %', now();
END;
$$;

-- Schedule the database function to run every minute to check for scheduled rules
SELECT cron.schedule(
  'check-prep-watch-rules-every-minute',  -- job name
  '* * * * *',                            -- run every minute
  'SELECT public.check_prep_watch_rules();'
);
