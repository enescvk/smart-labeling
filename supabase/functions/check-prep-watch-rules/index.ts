
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PrepWatchRule {
  id: string;
  food_type: string;
  minimum_count: number;
  restaurant_id: string;
  notify_email: string;
  check_hour: number;
  check_minute: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase URL or service role key");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    console.log(`Checking PrepWatch rules at ${currentHour}:${currentMinute}`);

    // Fetch all PrepWatch rules
    const { data: rules, error: rulesError } = await supabase
      .from("prep_watch_settings")
      .select("*");

    if (rulesError) throw rulesError;

    console.log(`Found ${rules.length} PrepWatch rules to check`);
    
    // Process each rule
    for (const rule of rules as PrepWatchRule[]) {
      // Check if it's time to run this rule
      if (rule.check_hour === currentHour && rule.check_minute === currentMinute) {
        console.log(`Processing rule for ${rule.food_type}, minimum: ${rule.minimum_count}`);
        
        // Get active inventory items for this food type
        const { data: items, error: itemsError } = await supabase
          .from("inventory")
          .select("id, product")
          .eq("restaurant_id", rule.restaurant_id)
          .eq("status", "active")
          .eq("product", rule.food_type);
          
        if (itemsError) {
          console.error(`Error fetching inventory for rule ${rule.id}:`, itemsError);
          continue;
        }
        
        const activeCount = items?.length || 0;
        console.log(`Found ${activeCount} active ${rule.food_type} items, minimum required: ${rule.minimum_count}`);
        
        // If count is below minimum, create a notification and send an email
        if (activeCount < rule.minimum_count) {
          console.log(`Inventory level for ${rule.food_type} is below minimum threshold. Sending notification...`);
          
          // Create a notification record
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              restaurant_id: rule.restaurant_id,
              title: `Low Inventory Alert: ${rule.food_type}`,
              message: `${rule.food_type} count (${activeCount}) is below the minimum requirement of ${rule.minimum_count}`,
              type: "warning",
              read: false,
              link: "/history",
              timestamp: new Date().toISOString()
            });
            
          if (notificationError) {
            console.error("Error creating notification:", notificationError);
          } else {
            console.log("Notification created successfully");
          }
          
          // Send email notification
          try {
            await resend.emails.send({
              from: "PrepWatch <onboarding@resend.dev>",
              to: rule.notify_email,
              subject: `Low Inventory Alert: ${rule.food_type}`,
              html: `
                <h1>Low Inventory Alert</h1>
                <p>The current inventory level for ${rule.food_type} is below the minimum threshold:</p>
                <ul>
                  <li>Current Count: ${activeCount}</li>
                  <li>Minimum Required: ${rule.minimum_count}</li>
                </ul>
                <p>Please prepare more items to maintain the required inventory level.</p>
              `,
            });
            console.log(`Email notification sent to ${rule.notify_email}`);
          } catch (emailError) {
            console.error("Error sending email:", emailError);
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "PrepWatch rules checked successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-prep-watch-rules function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
