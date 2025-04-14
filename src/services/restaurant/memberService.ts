
import { supabase } from "@/integrations/supabase/client";
import type { RestaurantMember, RestaurantInvitation } from "./types";

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
      // Handle case where user might be null
      if (!member.user) {
        return {
          id: member.id,
          user_id: member.user_id,
          restaurant_id: member.restaurant_id,
          role: member.role as 'admin' | 'staff' | 'viewer',
          created_at: member.created_at,
          updated_at: member.updated_at,
          user: {
            email: 'Unknown Email'
          }
        };
      }
      
      // Check if user property exists and has an error field
      if (typeof member.user === 'object' && 'error' in member.user) {
        return {
          id: member.id,
          user_id: member.user_id,
          restaurant_id: member.restaurant_id,
          role: member.role as 'admin' | 'staff' | 'viewer',
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
        role: member.role as 'admin' | 'staff' | 'viewer',
        created_at: member.created_at,
        updated_at: member.updated_at,
        user: {
          // Safely extract email from user object, with fallback
          email: (typeof member.user === 'object' && 'email' in member.user && member.user.email !== null) 
            ? String(member.user.email) 
            : 'Unknown Email'
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
export const addRestaurantMember = async (restaurantId: string, email: string, role: 'admin' | 'staff' | 'viewer'): Promise<void> => {
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

// Get pending invitations for a restaurant
export const getRestaurantInvitations = async (restaurantId: string): Promise<RestaurantInvitation[]> => {
  try {
    const { data: invitations, error } = await supabase
      .from('restaurant_invitations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error("Error fetching restaurant invitations:", error);
      throw new Error(error.message);
    }

    // Cast the role field to ensure type safety
    return (invitations || []).map(invitation => ({
      ...invitation,
      role: invitation.role as 'admin' | 'staff' | 'viewer'
    }));
  } catch (error) {
    console.error("Error in getRestaurantInvitations:", error);
    throw error;
  }
};

// Send invitation to join a restaurant
export const sendRestaurantInvitation = async (
  restaurantId: string, 
  email: string, 
  role: 'admin' | 'staff' | 'viewer',
  restaurantName: string
): Promise<void> => {
  try {
    // Get current user for the inviter name
    const { data: { user } } = await supabase.auth.getUser();
    const inviterName = user?.email?.split('@')[0] || "Restaurant Admin";

    // Call the edge function to send invitation
    const { error } = await supabase.functions.invoke("send-invitation", {
      body: {
        restaurantId,
        email,
        role,
        restaurantName,
        inviterName
      },
    });

    if (error) {
      console.error("Error sending invitation:", error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error("Error in sendRestaurantInvitation:", error);
    throw error;
  }
};

// Cancel a pending invitation
export const cancelInvitation = async (invitationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('restaurant_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error("Error canceling invitation:", error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error("Error in cancelInvitation:", error);
    throw error;
  }
};
