
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
    
    // Use direct RPC call to avoid recursion in policies
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
  if (!restaurantId) {
    console.log("No restaurant ID provided to getRestaurantMembers");
    return [];
  }

  try {
    console.log("Fetching members for restaurant:", restaurantId);

    // Use direct query to fetch restaurant members
    const { data: members, error } = await supabase
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
      
    if (error) {
      console.error("Error fetching restaurant members:", error);
      
      // Handle recursion policy errors with a user-friendly message
      if (error.message.includes("recursion") || error.message.includes("policy")) {
        toast.error("Database policy error detected. Please refresh the page.", {
          id: "member-recursion-error",
          duration: 5000,
        });
        
        // Try using a different approach to fetch members
        const { data: memberData, error: fallbackError } = await supabase
          .rpc('get_member_restaurants');
          
        if (fallbackError) {
          console.error("Error using RPC fallback:", fallbackError);
          return [];
        }
        
        if (!memberData) {
          console.log("No members returned from RPC function");
          return [];
        }
        
        // Process the member data
        const memberIds = Array.isArray(memberData) ? memberData : [];
        if (memberIds.length === 0) {
          console.log("No member IDs found after processing");
          return [];
        }
        
        // Use the member IDs from the RPC call to fetch member details
        return formatMembers(memberIds);
      }
      
      return [];
    }
    
    if (!members || members.length === 0) {
      return [];
    }
    
    // Continue with the profile data fetching logic
    return formatMembersWithProfiles(members);
  } catch (err) {
    console.error("Error in getRestaurantMembers:", err);
    return [];
  }
};

// Helper function to format member IDs returned from RPC
const formatMembers = async (memberData: any[]): Promise<RestaurantMember[]> => {
  try {
    // Extract user IDs from the member data
    const userIds = memberData.map(member => member.user_id);
    
    // Fetch profiles for the user IDs
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username, first_name, last_name")
      .in("id", userIds);
    
    if (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }
    
    // Create a map for quick profile lookup
    const profileMap = new Map();
    if (profiles) {
      profiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }
    
    // Format the members with profile data
    const formattedMembers: RestaurantMember[] = [];
    for (const member of memberData) {
      const profile = profileMap.get(member.user_id);
      
      formattedMembers.push({
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
      });
    }
    
    return formattedMembers;
  } catch (err) {
    console.error("Error in formatMembers:", err);
    return [];
  }
};

// Helper function to format members with their profiles
const formatMembersWithProfiles = async (members: any[]): Promise<RestaurantMember[]> => {
  // Fetch all profiles at once to reduce database calls
  const userIds = members.map(member => member.user_id);
  
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name")
    .in("id", userIds);
  
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    // Continue with the members data even if profiles can't be fetched
  }
  
  // Create a map for quick profile lookup
  const profileMap = new Map();
  if (profiles) {
    profiles.forEach(profile => {
      profileMap.set(profile.id, profile);
    });
  }

  const formattedMembers: RestaurantMember[] = [];
  for (const member of members) {
    const profile = profileMap.get(member.user_id);
    
    formattedMembers.push({
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
    });
  }

  console.log("Formatted members:", formattedMembers);
  return formattedMembers;
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
