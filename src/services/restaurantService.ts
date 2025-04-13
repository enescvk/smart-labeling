
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
  try {
    console.log("Fetching user restaurants");
    
    // Get current user to confirm we have an authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("No authenticated user found:", userError);
      return [];
    }
    console.log("Current user:", user.id);
    
    // First get the restaurant IDs that the user has access to
    const { data: restaurantIds, error: idsError } = await supabase
      .rpc('get_user_restaurant_ids');
    
    if (idsError) {
      console.error("Error fetching user restaurant IDs:", idsError);
      throw new Error(idsError.message);
    }

    console.log("Restaurant IDs:", restaurantIds);
    if (!restaurantIds || restaurantIds.length === 0) {
      return [];
    }
    
    // Now fetch the actual restaurants using those IDs
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .in('id', restaurantIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching restaurants:", error);
      throw new Error(error.message);
    }

    console.log("Fetched restaurants:", restaurants);
    return restaurants || [];
  } catch (error) {
    console.error("Error in getUserRestaurants:", error);
    throw error;
  }
};

// Create a new restaurant and add current user as admin
export const createRestaurant = async (name: string): Promise<Restaurant> => {
  console.log("Creating restaurant with name:", name);
  try {
    // Use the security definer function to create restaurant and add the current user as admin
    const { data, error } = await supabase
      .rpc('create_restaurant_with_admin', {
        restaurant_name: name,
      });

    if (error) {
      console.error("Error creating restaurant:", error);
      throw new Error(error.message);
    }

    console.log("Restaurant created with ID:", data);
    
    // Now fetch the restaurant by ID to get the complete restaurant object
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
  } catch (error) {
    console.error("Error in createRestaurant:", error);
    throw error;
  }
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
  try {
    const { data, error } = await supabase
      .rpc('is_restaurant_admin', {
        restaurant_id: restaurantId,
      });

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in isRestaurantAdmin:", error);
    return false;
  }
};

// Get all members of a restaurant
export const getRestaurantMembers = async (restaurantId: string): Promise<RestaurantMember[]> => {
  try {
    // First get current user's email and ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("No authenticated user found:", userError);
      throw new Error("No authenticated user found");
    }
    
    console.log("Current user:", user.id, user.email);
    
    // Then get profiles with emails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email:username');
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw new Error(profilesError.message);
    }
    
    console.log("Fetched profiles:", profiles);
    
    // Now get restaurant members
    const { data: members, error } = await supabase
      .from('restaurant_members')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error("Error fetching restaurant members:", error);
      throw new Error(error.message);
    }

    console.log("Fetched members:", members);

    // Merge the profile emails with the members
    const membersWithEmails = (members || []).map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      return {
        ...member,
        user: { 
          email: profile?.email || (member.user_id === user.id ? user.email : 'Unknown Email')
        }
      };
    }) as RestaurantMember[];
    
    console.log("Members with emails:", membersWithEmails);
    
    return membersWithEmails;
  } catch (error) {
    console.error("Error in getRestaurantMembers:", error);
    throw error;
  }
};

// Add a user to a restaurant
export const addRestaurantMember = async (restaurantId: string, email: string, role: 'admin' | 'staff'): Promise<void> => {
  try {
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
  } catch (error) {
    console.error("Error in addRestaurantMember:", error);
    throw error;
  }
};

// Remove a member from a restaurant
export const removeRestaurantMember = async (memberId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('restaurant_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error("Error removing restaurant member:", error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error("Error in removeRestaurantMember:", error);
    throw error;
  }
};

// Get current restaurant name (most recently created/used)
export const getCurrentRestaurantName = async (): Promise<string | null> => {
  try {
    const restaurants = await getUserRestaurants();
    return restaurants.length > 0 ? restaurants[0].name : null;
  } catch (error) {
    console.error("Error in getCurrentRestaurantName:", error);
    return null;
  }
};

// Get the current restaurant ID (first one in the list)
export const getCurrentRestaurantId = async (): Promise<string | null> => {
  try {
    const restaurants = await getUserRestaurants();
    return restaurants.length > 0 ? restaurants[0].id : null;
  } catch (error) {
    console.error("Error in getCurrentRestaurantId:", error);
    return null;
  }
};
