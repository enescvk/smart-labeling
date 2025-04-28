
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
    console.log("PrepWatch check function started at " + new Date().toISOString());
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase URL or service role key");
    }
    
    console.log("Environment variables loaded successfully");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    console.log(`Running PrepWatch check at ${now.toISOString()}`);
    console.log(`Current time: ${currentHour}:${currentMinute}`);

    // Parse request body if available
    let forceRun = true;  // Default to true for testing
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        const requestData = await req.json();
        if (requestData && typeof requestData === 'object') {
          forceRun = !!requestData.forceRun;
          console.log(`Force run parameter received: ${forceRun}`);
        }
      }
    } catch (e) {
      console.log("No valid JSON body or no forceRun parameter");
    }

    // Fetch all PrepWatch rules
    const { data: rules, error: rulesError } = await supabase
      .from("prep_watch_settings")
      .select("*");

    if (rulesError) {
      console.error("Error fetching prep watch rules:", rulesError);
      throw rulesError;
    }

    console.log(`Found ${rules?.length || 0} PrepWatch rules to check`);
    
    // Log all rules for debugging
    rules?.forEach(rule => {
      console.log(`Rule ID: ${rule.id}, Food: ${rule.food_type}, Hour: ${rule.check_hour}, Minute: ${rule.check_minute}`);
    });
    
    // Process each rule
    const processedResults = [];
    
    if (!rules || rules.length === 0) {
      console.log("No PrepWatch rules found to process");
    }
    
    for (const rule of rules as PrepWatchRule[]) {
      // Expand the time check with a small window to account for scheduling delays
      const hourMatches = rule.check_hour === currentHour;
      const minuteInRange = Math.abs(rule.check_minute - currentMinute) <= 5; // Allow 5-minute window
      
      console.log(`Checking rule for ${rule.food_type}: scheduled for ${rule.check_hour}:${rule.check_minute}`);
      console.log(`Hour match: ${hourMatches}, Minute in range: ${minuteInRange}`);
      
      // Always process all rules for debugging
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
        processedResults.push({
          ruleId: rule.id,
          success: false,
          error: itemsError.message
        });
        continue;
      }
      
      const activeCount = items?.length || 0;
      console.log(`Found ${activeCount} active ${rule.food_type} items, minimum required: ${rule.minimum_count}`);
      
      // Always create notification for testing
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
        processedResults.push({
          ruleId: rule.id,
          success: false,
          error: notificationError.message
        });
      } else {
        console.log("Notification created successfully:", notification);
        processedResults.push({
          ruleId: rule.id,
          success: true,
          notificationId: notification?.[0]?.id
        });
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
    }
    
    console.log("PrepWatch check completed at " + new Date().toISOString());
    console.log("Results:", processedResults);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "PrepWatch rules checked successfully",
        timestamp: new Date().toISOString(),
        results: processedResults
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-prep-watch-rules function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString() 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
