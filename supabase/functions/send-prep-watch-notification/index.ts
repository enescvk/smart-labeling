
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PrepWatchNotification {
  restaurant_id: string;
  food_type: string;
  current_count: number;
  minimum_count: number;
  notify_email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PrepWatchNotification = await req.json();
    const { food_type, current_count, minimum_count, notify_email } = payload;

    const emailResponse = await resend.emails.send({
      from: "PrepWatch <onboarding@resend.dev>",
      to: notify_email,
      subject: `Low Inventory Alert: ${food_type}`,
      html: `
        <h1>Low Inventory Alert</h1>
        <p>The current inventory level for ${food_type} is below the minimum threshold:</p>
        <ul>
          <li>Current Count: ${current_count}</li>
          <li>Minimum Required: ${minimum_count}</li>
        </ul>
        <p>Please prepare more items to maintain the required inventory level.</p>
      `,
    });

    console.log("PrepWatch notification sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending PrepWatch notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
