
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

    try {
      // Get the authenticated user's email for the "from" field
      const authHeader = req.headers.get('authorization');
      let userEmail = 'onboarding@resend.dev'; // Default fallback
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        // Get the user's email from the JWT if possible
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.email) {
            userEmail = payload.email;
          }
        } catch (e) {
          console.error("Could not parse JWT token:", e);
        }
      }

      // Send invitation email with appropriate 'from' address
      // For Resend free tier, only the account owner's email can be used as recipient
      // So we'll record the invitation details, but adapt the email sending based on limitations
      let emailResult;
      
      if (Deno.env.get('RESEND_MODE') === 'production') {
        // In production mode with a verified domain, use normal flow
        emailResult = await resend.emails.send({
          from: 'Inventory App <noreply@yourdomain.com>', // Replace with your verified domain
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
      } else {
        // In testing mode, only send to authenticated user's email
        // This works with Resend's free tier limitation
        emailResult = await resend.emails.send({
          from: 'Inventory App <onboarding@resend.dev>',
          to: [userEmail], // Send only to the authenticated user's email
          subject: '[TESTING] Restaurant Team Invitation',
          html: `
            <h1>TESTING MODE: Restaurant Team Invitation</h1>
            <p>This is a test email. In production, this would be sent to: ${email}</p>
            <p>The user has been invited to join a restaurant team with the role of ${role}.</p>
            <p>Invitation link: <a href="${invitationLink}">Accept Invitation</a></p>
            <p>This invitation will expire in 7 days.</p>
            <p><strong>Note:</strong> The invitation has been created in the database, but due to Resend's free tier 
            limitations, the actual email could only be sent to you (${userEmail}) instead of ${email}.</p>
          `
        });
      }

      console.log('Email sent successfully:', emailResult);

      return new Response(JSON.stringify({ 
        message: 'Invitation created successfully',
        details: "In test mode, invitation emails can only be sent to the authenticated user's email address.",
        emailResult
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      });

    } catch (emailError) {
      console.error('Error from Resend:', emailError);
      
      // Continue with invitation process even if email fails
      return new Response(JSON.stringify({ 
        message: 'Invitation created, but email sending failed',
        error: emailError.message,
        details: "The invitation has been recorded in the database but the email could not be sent due to Resend limitations. In free tier mode, you can only send to your own email address."
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200  // Return 200 instead of error since the invitation was created
      });
    }

  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process invitation',
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
