
-- Add check_day column to prep_watch_settings table for weekly schedules
ALTER TABLE prep_watch_settings 
ADD COLUMN IF NOT EXISTS check_day INTEGER;

-- Add a comment to explain the check_day values
COMMENT ON COLUMN prep_watch_settings.check_day IS 'Day of week for weekly frequency: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
