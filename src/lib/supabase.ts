
import { createClient } from '@supabase/supabase-js';

// Get environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing environment variables for Supabase. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
  // Provide fallback values for development only - replace with your Supabase project URL and anon key
  // For security reasons, you should properly set these environment variables
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
  supabaseUrl || 'https://your-supabase-url.supabase.co',  // Fallback URL (replace with your actual URL)
  supabaseAnonKey || 'your-anon-key'  // Fallback key (replace with your actual key)
);
