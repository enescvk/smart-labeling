
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
          prepared_date: string;
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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
