
import { supabase } from "@/integrations/supabase/client";
import { RestaurantMember } from "./types";
import { toast } from "sonner";

// Check if the current user is an admin of a restaurant
export const isRestaurantAdmin = async (restaurantId: string): Promise<boolean> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to isRestaurantAdmin");
    return false;
  }

  try {
    console.log("Checking if user is admin of restaurant:", restaurantId);
    
    // Use the security definer function that we created in our SQL migration
    const { data, error } = await supabase
      .rpc('check_is_restaurant_admin', {
        restaurant_id: restaurantId,
        user_id: undefined // This will default to auth.uid() in the function
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
  if (!restaurantId) {
    console.log("No restaurant ID provided to getRestaurantMembers");
    return [];
  }

  try {
    console.log("Fetching members for restaurant:", restaurantId);

    // Use RPC function to get restaurant members securely
    const { data: memberData, error: memberError } = await supabase
      .rpc('get_restaurant_members_with_profiles', {
        p_restaurant_id: restaurantId
      });

    if (memberError) {
      console.error("Error fetching restaurant members:", memberError);
      
      // Fallback to separate queries if RPC fails
      console.log("Falling back to separate queries...");
      return await getRestaurantMembersFallback(restaurantId);
    }

    if (!memberData || memberData.length === 0) {
      console.log("No members found for restaurant:", restaurantId);
      return [];
    }

    console.log("Found members via RPC:", memberData);

    const formattedMembers: RestaurantMember[] = memberData.map((member: any) => ({
      id: member.id,
      user_id: member.user_id,
      restaurant_id: member.restaurant_id,
      role: member.role as 'admin' | 'staff',
      created_at: member.created_at,
      updated_at: member.updated_at,
      user: {
        email: member.username || member.email || 'Unknown Email',
        first_name: member.first_name || null,
        last_name: member.last_name || null,
      }
    }));

    console.log("Formatted members:", formattedMembers);
    return formattedMembers;
  } catch (err) {
    console.error("Error in getRestaurantMembers:", err);
    
    // Fallback to separate queries
    console.log("Falling back to separate queries due to error...");
    return await getRestaurantMembersFallback(restaurantId);
  }
};

// Fallback function using separate queries
const getRestaurantMembersFallback = async (restaurantId: string): Promise<RestaurantMember[]> => {
  try {
    // First, get the restaurant members
    const { data: members, error: membersError } = await supabase
      .from('restaurant_members')
      .select(`
        id,
        user_id,
        restaurant_id,
        role,
        created_at,
        updated_at
      `)
      .eq('restaurant_id', restaurantId);
      
    if (membersError) {
      console.error("Error fetching restaurant members in fallback:", membersError);
      toast.error("Error fetching team members. Please refresh the page.", {
        id: "member-error",
        duration: 5000,
      });
      return [];
    }
    
    if (!members || members.length === 0) {
      console.log("No members found for restaurant in fallback:", restaurantId);
      return [];
    }

    console.log("Found members in fallback:", members);
    
    // Now fetch the profiles for these members using separate query
    const userIds = members.map(member => member.user_id);
    console.log("Fetching profiles for user IDs in fallback:", userIds);
    
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, first_name, last_name")
      .in("id", userIds);
    
    if (profilesError) {
      console.error("Error fetching profiles in fallback:", profilesError);
      // Return members without profile data if profiles can't be fetched
      const formattedMembersWithoutProfiles: RestaurantMember[] = members.map(member => ({
        id: member.id,
        user_id: member.user_id,
        restaurant_id: member.restaurant_id,
        role: member.role as 'admin' | 'staff',
        created_at: member.created_at,
        updated_at: member.updated_at,
        user: {
          email: 'Profile not found',
          first_name: null,
          last_name: null,
        }
      }));
      
      return formattedMembersWithoutProfiles;
    }
    
    console.log("Fetched profiles in fallback:", profiles);
    
    // Create a map for quick profile lookup
    const profileMap = new Map();
    if (profiles) {
      profiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    const formattedMembers: RestaurantMember[] = members.map(member => {
      const profile = profileMap.get(member.user_id);
      
      return {
        id: member.id,
        user_id: member.user_id,
        restaurant_id: member.restaurant_id,
        role: member.role as 'admin' | 'staff',
        created_at: member.created_at,
        updated_at: member.updated_at,
        user: {
          email: profile?.username || 'Unknown Email',
          first_name: profile?.first_name ?? null,
          last_name: profile?.last_name ?? null,
        }
      };
    });

    console.log("Formatted members in fallback:", formattedMembers);
    return formattedMembers;
  } catch (err) {
    console.error("Error in getRestaurantMembersFallback:", err);
    toast.error("Unexpected error fetching team members.", {
      id: "member-error",
      duration: 5000,
    });
    return [];
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
