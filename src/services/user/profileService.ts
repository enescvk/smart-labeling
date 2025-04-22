
import { supabase } from "@/integrations/supabase/client";

export type UserProfile = {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
};

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

export async function updateUserProfile(userId: string, profile: { first_name?: string; last_name?: string }) {
  const { error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId);
  if (error) {
    throw error;
  }
}
