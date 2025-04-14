
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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

    // Construct invitation link
    const invitationLink = `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/accept-invitation?token=${invitationToken}`;

    // Send invitation email
    const { error } = await resend.emails.send({
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
      throw error;
    }

    return new Response(JSON.stringify({ 
      message: 'Invitation sent successfully' 
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
      error: 'Failed to send invitation' 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 500
    });
  }
});
