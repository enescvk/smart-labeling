
import { supabase } from "@/integrations/supabase/client";
import { RestaurantMember } from "./types";

// Check if the current user is an admin of a restaurant
export const isRestaurantAdmin = async (restaurantId: string): Promise<boolean> => {
  try {
    console.log("Checking if user is admin of restaurant:", restaurantId);
    
    const { data, error } = await supabase
      .rpc('is_admin_of_restaurant', {
        p_restaurant_id: restaurantId,
      });

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    console.log("Admin check result:", data);
    return !!data;
  } catch (error) {
    console.error("Error in isRestaurantAdmin:", error);
    return false;
  }
};

// Get all members of a restaurant
export const getRestaurantMembers = async (restaurantId: string): Promise<RestaurantMember[]> => {
  try {
    console.log("Fetching members for restaurant:", restaurantId);
    
    // Get all members for this restaurant directly from the database
    // Fix: modified the join approach to ensure correct type safety
    const { data: members, error } = await supabase
      .from('restaurant_members')
      .select(`
        id,
        user_id,
        restaurant_id,
        role,
        created_at,
        updated_at,
        profiles (
          username
        )
      `)
      .eq('restaurant_id', restaurantId);
    
    if (error) {
      console.error("Error fetching restaurant members:", error);
      throw error;
    }
    
    // Map the results to match our RestaurantMember type
    const formattedMembers: RestaurantMember[] = members.map(member => ({
      id: member.id,
      user_id: member.user_id,
      restaurant_id: member.restaurant_id,
      role: member.role as 'admin' | 'staff',
      created_at: member.created_at,
      updated_at: member.updated_at,
      user: {
        email: member.profiles?.username || 'Unknown Email'
      }
    }));
    
    console.log("Fetched members:", formattedMembers);
    return formattedMembers;
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
      .eq('username', email);

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
