
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://htrstvloqgqvnvtiqfwa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cnN0dmxvcWdxdm52dGlxZndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NjU2ODcsImV4cCI6MjA1ODU0MTY4N30.R4cxC3z5aCUGYZIQWgMs2hoYrUHKYC3U89KXNbYmyHw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
