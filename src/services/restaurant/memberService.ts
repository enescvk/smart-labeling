
import { supabase } from "@/integrations/supabase/client";
import type { RestaurantMember } from "./types";

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
    
    // Now get restaurant members from the database
    const { data: members, error } = await supabase
      .from('restaurant_members')
      .select(`
        id,
        user_id,
        restaurant_id,
        role,
        created_at,
        updated_at,
        user:profiles!user_id(email:username)
      `)
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error("Error fetching restaurant members:", error);
      
      // If there's an error fetching members, at least show the current user
      // if they are an admin
      return await getFallbackCurrentUserMember(restaurantId, user.id, user.email);
    }

    console.log("Fetched members:", members);
    
    if (!members || members.length === 0) {
      // If no members returned, check if current user is admin
      return await getFallbackCurrentUserMember(restaurantId, user.id, user.email);
    }

    // Process the members data to handle potential relation errors
    const processedMembers: RestaurantMember[] = members.map(member => {
      // Check if user property exists and has an error field 
      // TypeScript fix: First check if user exists, then check if it has an 'error' property
      if (member.user && typeof member.user === 'object' && 'error' in member.user) {
        // Return a well-formed RestaurantMember with default user email
        return {
          id: member.id,
          user_id: member.user_id,
          restaurant_id: member.restaurant_id,
          role: member.role as 'admin' | 'staff',
          created_at: member.created_at,
          updated_at: member.updated_at,
          user: {
            email: 'Unknown Email'
          }
        };
      }
      
      // Handle case where user might be null
      if (!member.user) {
        return {
          id: member.id,
          user_id: member.user_id,
          restaurant_id: member.restaurant_id,
          role: member.role as 'admin' | 'staff',
          created_at: member.created_at,
          updated_at: member.updated_at,
          user: {
            email: 'Unknown Email'
          }
        };
      }
      
      // Use type assertion after we've checked all cases
      return {
        id: member.id,
        user_id: member.user_id,
        restaurant_id: member.restaurant_id,
        role: member.role as 'admin' | 'staff',
        created_at: member.created_at,
        updated_at: member.updated_at,
        user: {
          email: member.user.email
        }
      };
    });
    
    return processedMembers;
  } catch (error) {
    console.error("Error in getRestaurantMembers:", error);
    throw error;
  }
};

// Helper function to get current user as a member fallback
const getFallbackCurrentUserMember = async (
  restaurantId: string, 
  userId: string, 
  userEmail?: string
): Promise<RestaurantMember[]> => {
  // Check if current user is a restaurant admin
  const { data: isAdmin, error: adminCheckError } = await supabase
    .rpc('is_admin_of_restaurant', { p_restaurant_id: restaurantId });
  
  if (adminCheckError) {
    console.error("Error checking admin status:", adminCheckError);
    return [];
  }
  
  console.log("Is current user an admin?", isAdmin);
  
  // If we can determine the user is an admin, add them to the members list
  if (isAdmin) {
    const currentUserMember: RestaurantMember = {
      id: 'current-user', // We don't have the actual member ID but this works as a placeholder
      user_id: userId,
      restaurant_id: restaurantId,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        email: userEmail || 'Unknown Email'
      }
    };
    
    console.log("Using current user as member:", [currentUserMember]);
    return [currentUserMember];
  }
  
  return [];
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
