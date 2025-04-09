
import { supabase } from "@/integrations/supabase/client";

export type Restaurant = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type RestaurantMember = {
  id: string;
  user_id: string;
  restaurant_id: string;
  role: 'admin' | 'staff';
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
  };
};

// Get restaurants that the current user is a member of
export const getUserRestaurants = async (): Promise<Restaurant[]> => {
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select(`
      *,
      restaurant_members!inner(user_id)
    `)
    .eq('restaurant_members.user_id', (await supabase.auth.getUser()).data.user?.id || '')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching user restaurants:", error);
    throw new Error(error.message);
  }

  return restaurants || [];
};

// Create a new restaurant and add current user as admin
export const createRestaurant = async (name: string): Promise<Restaurant> => {
  const { data, error } = await supabase
    .rpc('create_restaurant_with_admin', {
      restaurant_name: name,
    });

  if (error) {
    console.error("Error creating restaurant:", error);
    throw new Error(error.message);
  }

  // Fetch the newly created restaurant
  const { data: restaurant, error: fetchError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) {
    console.error("Error fetching created restaurant:", fetchError);
    throw new Error(fetchError.message);
  }

  return restaurant;
};

// Get all members of a restaurant
export const getRestaurantMembers = async (restaurantId: string): Promise<RestaurantMember[]> => {
  const { data, error } = await supabase
    .from('restaurant_members')
    .select(`
      *,
      user:user_id(email)
    `)
    .eq('restaurant_id', restaurantId);

  if (error) {
    console.error("Error fetching restaurant members:", error);
    throw new Error(error.message);
  }

  return data || [];
};

// Add a user to a restaurant
export const addRestaurantMember = async (restaurantId: string, email: string, role: 'admin' | 'staff'): Promise<void> => {
  // First find the user by email
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email);

  if (userError) {
    console.error("Error finding user:", userError);
    throw new Error(userError.message);
  }

  if (!users || users.length === 0) {
    throw new Error("User not found with this email");
  }

  // Add user to restaurant
  const { error } = await supabase
    .from('restaurant_members')
    .insert({
      restaurant_id: restaurantId,
      user_id: users[0].id,
      role
    });

  if (error) {
    console.error("Error adding restaurant member:", error);
    throw new Error(error.message);
  }
};

// Remove a member from a restaurant
export const removeRestaurantMember = async (memberId: string): Promise<void> => {
  const { error } = await supabase
    .from('restaurant_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    console.error("Error removing restaurant member:", error);
    throw new Error(error.message);
  }
};

// Get current restaurant name (most recently created/used)
export const getCurrentRestaurantName = async (): Promise<string | null> => {
  const restaurants = await getUserRestaurants();
  return restaurants.length > 0 ? restaurants[0].name : null;
};
