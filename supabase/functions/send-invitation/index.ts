
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { restaurantId, email, role, restaurantName, inviterName } = await req.json();
    
    // Validate required fields
    if (!restaurantId || !email || !role || !restaurantName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("restaurant_invitations")
      .insert({
        restaurant_id: restaurantId,
        email: email,
        role: role,
        created_by: req.headers.get("x-user-id") || ""
      })
      .select("invitation_token")
      .single();

    if (invitationError) {
      if (invitationError.code === "23505") { // Unique violation (email already invited)
        return new Response(
          JSON.stringify({ error: "This email has already been invited to this restaurant" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw invitationError;
    }

    // Generate invitation link
    const baseUrl = Deno.env.get("FRONTEND_URL") || "https://localhost:3000";
    const invitationLink = `${baseUrl}/invite?token=${invitation?.invitation_token}`;

    // Send email using Supabase's built-in email service
    const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: invitationLink,
      data: {
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        role: role,
        inviter_name: inviterName || "A restaurant admin",
        invitation_token: invitation?.invitation_token
      }
    });

    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      throw emailError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-invitation function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send invitation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
