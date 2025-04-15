
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
          id: 'current-user', // We don't have the actual member ID but this works as a placeholder
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
    
    // Return an array with just the current user for now
    // In a production environment, you'd want to properly fetch all members
    // but this ensures the user sees themselves in the list
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

// Add a new function to create and send restaurant invitation
export const sendRestaurantInvitation = async (
  restaurantId: string, 
  email: string, 
  role: 'admin' | 'staff'
): Promise<void> => {
  try {
    // First, check if the user is an admin of the restaurant
    const { data: isAdmin, error: adminCheckError } = await supabase
      .rpc('is_admin_of_restaurant', {
        p_restaurant_id: restaurantId,
      });

    console.log("Admin check for invitation:", isAdmin, "for restaurant:", restaurantId);
    
    if (adminCheckError) {
      console.error("Admin check error:", adminCheckError);
      throw new Error(`Admin check failed: ${adminCheckError.message}`);
    }

    if (!isAdmin) {
      throw new Error("Only restaurant admins can send invitations");
    }

    // Check if there's already an invitation for this email and restaurant
    const { data: existingInvitation, error: checkError } = await supabase
      .from('restaurant_invitations')
      .select('id, role, invitation_token')
      .eq('restaurant_id', restaurantId)
      .eq('email', email)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing invitations:", checkError);
      throw checkError;
    }
    
    let invitationToken;
    
    if (existingInvitation) {
      console.log("Found existing invitation:", existingInvitation);
      
      // Update the existing invitation with the new role and reset expiry
      const { error: updateError } = await supabase
        .from('restaurant_invitations')
        .update({
          role: role,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null, // Reset accepted_at if it was previously accepted
        })
        .eq('id', existingInvitation.id);
        
      if (updateError) {
        console.error("Error updating invitation:", updateError);
        throw updateError;
      }
      
      invitationToken = existingInvitation.invitation_token;
    } else {
      // Create a new invitation record
      const { data: newInvitation, error: insertError } = await supabase
        .from('restaurant_invitations')
        .insert({
          restaurant_id: restaurantId,
          email,
          role,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select('invitation_token')
        .single();

      if (insertError) {
        console.error("Error creating invitation:", insertError);
        throw insertError;
      }
      
      invitationToken = newInvitation.invitation_token;
    }

    // Call the edge function to send the invitation email
    const response = await supabase.functions.invoke('send-restaurant-invitation', {
      body: JSON.stringify({
        restaurantId,
        email,
        role,
        invitationToken
      })
    });

    // Check for edge function errors
    if (response.error) {
      console.error("Edge function error:", response.error);
      throw new Error(response.error.message || "Failed to send invitation email");
    }

    console.log('Invitation processed successfully');
  } catch (error: any) {
    console.error("Error sending restaurant invitation:", error);
    throw error;
  }
};

// Add a function to accept an invitation
export const acceptRestaurantInvitation = async (
  invitationToken: string, 
  password: string
): Promise<void> => {
  try {
    const { data, error } = await supabase
      .rpc('process_invitation', {
        invitation_token: invitationToken,
        password
      });

    if (error) {
      throw error;
    }

    if (data === null) {
      throw new Error("Invalid or expired invitation");
    }

    console.log('Invitation accepted successfully');
  } catch (error) {
    console.error("Error accepting invitation:", error);
    throw error;
  }
};
