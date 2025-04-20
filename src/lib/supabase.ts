
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

// Get environment variables with validation
const supabaseUrl = "https://htrstvloqgqvnvtiqfwa.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cnN0dmxvcWdxdm52dGlxZndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NjU2ODcsImV4cCI6MjA1ODU0MTY4N30.R4cxC3z5aCUGYZIQWgMs2hoYrUHKYC3U89KXNbYmyHw";

// Create the Supabase client with proper typing and explicit auth configuration
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Add a simple test query to verify connectivity
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('inventory').select('count').single();
    
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('Supabase connection successful!');
    return true;
  } catch (err) {
    console.error('Exception in testSupabaseConnection:', err);
    return false;
  }
};
