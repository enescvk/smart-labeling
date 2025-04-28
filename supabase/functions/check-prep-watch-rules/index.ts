
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
  frequency: string;
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
    
    console.log(`Running PrepWatch check at ${now.toISOString()}`);
    console.log(`Current time: ${currentHour}:${currentMinute}`);

    // Fetch all PrepWatch rules
    const { data: rules, error: rulesError } = await supabase
      .from("prep_watch_settings")
      .select("*");

    if (rulesError) throw rulesError;

    console.log(`Found ${rules.length} PrepWatch rules to check`);
    
    // Log all rules for debugging
    rules.forEach(rule => {
      console.log(`Rule ID: ${rule.id}, Food: ${rule.food_type}, Hour: ${rule.check_hour}, Minute: ${rule.check_minute}`);
    });
    
    // Process each rule
    for (const rule of rules as PrepWatchRule[]) {
      // Expand the time check with a small window to account for scheduling delays
      const hourMatches = rule.check_hour === currentHour;
      const minuteInRange = Math.abs(rule.check_minute - currentMinute) <= 5; // Allow 5-minute window
      
      console.log(`Checking rule for ${rule.food_type}: scheduled for ${rule.check_hour}:${rule.check_minute}`);
      console.log(`Hour match: ${hourMatches}, Minute in range: ${minuteInRange}`);
      
      // FOR TESTING: Set to true to force processing all rules regardless of time
      const forceProcess = true;
      
      if (hourMatches && minuteInRange || forceProcess) {
        console.log(`Processing rule ID ${rule.id} - ${rule.food_type}. Getting inventory...`);
        
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
        
        // FOR TESTING: Set to true to force notification creation regardless of count
        const forceNotification = true;
        
        // If count is below minimum, create a notification and send an email
        if (activeCount < rule.minimum_count || forceNotification) {
          console.log(`Creating notification for ${rule.food_type} (${activeCount}/${rule.minimum_count})...`);
          
          // Create a notification record
          const notificationData = {
            restaurant_id: rule.restaurant_id,
            title: `Low Inventory Alert: ${rule.food_type}`,
            message: `${rule.food_type} count (${activeCount}) is below the minimum requirement of ${rule.minimum_count}`,
            type: "warning",
            read: false,
            link: "/history",
            timestamp: new Date().toISOString()
          };
          
          console.log("Notification data to insert:", notificationData);
          
          const { data: notification, error: notificationError } = await supabase
            .from("notifications")
            .insert(notificationData)
            .select();
            
          if (notificationError) {
            console.error("Error creating notification:", notificationError);
          } else {
            console.log("Notification created successfully:", notification);
          }
          
          // Send email notification
          try {
            const emailResponse = await resend.emails.send({
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
            console.log(`Email notification sent to ${rule.notify_email}:`, emailResponse);
          } catch (emailError) {
            console.error("Error sending email:", emailError);
          }
        } else {
          console.log(`Inventory level for ${rule.food_type} is sufficient (${activeCount}/${rule.minimum_count}). No notification needed.`);
        }
      } else {
        console.log(`Time condition not met for rule ID ${rule.id} - ${rule.food_type}. Skipping.`);
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
