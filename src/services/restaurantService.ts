
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
  console.log("Creating restaurant with name:", name);
  const { data, error } = await supabase
    .rpc('create_restaurant_with_admin', {
      restaurant_name: name,
    });

  if (error) {
    console.error("Error creating restaurant:", error);
    throw new Error(error.message);
  }

  console.log("Restaurant created with ID:", data);
  
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

// Update restaurant name
export const updateRestaurant = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('restaurants')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error("Error updating restaurant:", error);
    throw new Error(error.message);
  }
};

// Check if the current user is an admin of a restaurant
export const isRestaurantAdmin = async (restaurantId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('is_restaurant_admin', {
      restaurant_id: restaurantId,
    });

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return !!data;
};

// Get all members of a restaurant
export const getRestaurantMembers = async (restaurantId: string): Promise<RestaurantMember[]> => {
  // First get profiles with emails
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email:username');
    
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    throw new Error(profilesError.message);
  }
  
  // Now get restaurant members
  const { data: members, error } = await supabase
    .from('restaurant_members')
    .select('*')
    .eq('restaurant_id', restaurantId);

  if (error) {
    console.error("Error fetching restaurant members:", error);
    throw new Error(error.message);
  }

  // Merge the profile emails with the members
  const membersWithEmails = (members || []).map(member => {
    const profile = profiles?.find(p => p.id === member.user_id);
    return {
      ...member,
      user: { 
        email: profile?.email || 'Unknown Email' 
      }
    };
  }) as RestaurantMember[];
  
  return membersWithEmails;
};

// Add a user to a restaurant
export const addRestaurantMember = async (restaurantId: string, email: string, role: 'admin' | 'staff'): Promise<void> => {
  // First find the user by email
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', email); // Using username as email

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

// Get the current restaurant ID (first one in the list)
export const getCurrentRestaurantId = async (): Promise<string | null> => {
  const restaurants = await getUserRestaurants();
  return restaurants.length > 0 ? restaurants[0].id : null;
};
