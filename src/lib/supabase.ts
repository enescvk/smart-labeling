
import { createClient } from '@supabase/supabase-js';

// Get environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://htrstvloqgqvnvtiqfwa.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cnN0dmxvcWdxdm52dGlxZndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NjU2ODcsImV4cCI6MjA1ODU0MTY4N30.R4cxC3z5aCUGYZIQWgMs2hoYrUHKYC3U89KXNbYmyHw";

// Validate that required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing environment variables for Supabase. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

export type Database = {
  public: {
    Tables: {
      inventory: {
        Row: {
          id: string;
          product: string;
          prepared_by: string;
          prepared_date: string;
          expiry_date: string;
          status: 'active' | 'used';
          created_at: string;
        };
        Insert: {
          id: string;
          product: string;
          prepared_by: string;
          prepared_date?: string;
          expiry_date: string;
          status?: 'active' | 'used';
          created_at?: string;
        };
        Update: {
          id?: string;
          product?: string;
          prepared_by?: string;
          prepared_date?: string;
          expiry_date?: string;
          status?: 'active' | 'used';
          created_at?: string;
        };
      };
    };
  };
};

// Create the Supabase client with proper typing
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);
