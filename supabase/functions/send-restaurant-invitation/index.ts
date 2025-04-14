
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      restaurantId, 
      email, 
      role, 
      invitationToken 
    } = await req.json();

    // Verify required parameters are present
    if (!email || !invitationToken) {
      console.error("Missing required parameters");
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Construct invitation link
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
    const invitationLink = `${siteUrl}/accept-invitation?token=${invitationToken}`;

    console.log(`Sending invitation email to ${email} with role ${role}`);
    console.log(`Invitation link: ${invitationLink}`);

    // Send invitation email
    const { data, error } = await resend.emails.send({
      from: 'Inventory App <onboarding@resend.dev>',
      to: [email],
      subject: 'You\'ve been invited to join a restaurant team',
      html: `
        <h1>Restaurant Team Invitation</h1>
        <p>You've been invited to join a restaurant team with the role of ${role}.</p>
        <p>Click the link below to set up your account:</p>
        <a href="${invitationLink}">Accept Invitation</a>
        <p>This invitation will expire in 7 days.</p>
      `
    });

    if (error) {
      console.error('Error from Resend:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(JSON.stringify({ 
      message: 'Invitation sent successfully',
      data
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send invitation',
      details: error.message
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 500
    });
  }
});
