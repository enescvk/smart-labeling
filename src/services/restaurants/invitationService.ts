import { supabase } from "@/integrations/supabase/client";

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

export const getPendingInvitations = async (restaurantId: string) => {
  try {
    const { data: invitations, error } = await supabase
      .from('restaurant_invitations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());
      
    if (error) {
      console.error("Error fetching pending invitations:", error);
      throw error;
    }

    return invitations || [];
  } catch (error) {
    console.error("Error in getPendingInvitations:", error);
    throw error;
  }
};
