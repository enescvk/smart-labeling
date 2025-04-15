
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
    // First get current user's email and ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("No authenticated user found:", userError);
      throw new Error("No authenticated user found");
    }
    
    console.log("Current user:", user.id, user.email);
    
    // Use a more direct approach: create a manual array with the current user's info
    let currentUserMember: RestaurantMember | null = null;
    
    // Check if current user is a restaurant admin
    const { data: isAdmin, error: adminCheckError } = await supabase
      .rpc('is_admin_of_restaurant', { p_restaurant_id: restaurantId });
    
    if (adminCheckError) {
      console.error("Error checking admin status:", adminCheckError);
    } else {
      console.log("Is current user an admin?", isAdmin);
      
      // If we can determine the user is an admin, add them to the members list
      if (isAdmin) {
        currentUserMember = {
          id: 'current-user',
          user_id: user.id,
          restaurant_id: restaurantId,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            email: user.email || 'Unknown Email'
          }
        };
      }
    }
    
    const members: RestaurantMember[] = [];
    if (currentUserMember) {
      members.push(currentUserMember);
    }
    
    console.log("Using current user as member:", members);
    return members;
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
