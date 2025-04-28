
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";

// Define types for PrepWatch rule and inventory item
interface PrepWatchRule {
  id: string;
  food_type: string;
  minimum_count: number;
  restaurant_id: string;
  notify_email: string;
}

interface InventoryItem {
  id: string;
  product: string;
  status: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with URL and service role key from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase URL or service role key");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Checking PrepWatch rules...");

    // Fetch all active PrepWatch rules
    const { data: rules, error: rulesError } = await supabase
      .from("prep_watch_settings")
      .select("*");

    if (rulesError) {
      throw rulesError;
    }

    console.log(`Found ${rules.length} PrepWatch rules to check`);
    
    // Process each rule
    for (const rule of rules as PrepWatchRule[]) {
      console.log(`Processing rule for ${rule.food_type}, minimum: ${rule.minimum_count}`);
      
      // Get active inventory items for this food type
      const { data: items, error: itemsError } = await supabase
        .from("inventory")
        .select("id, product, status")
        .eq("restaurant_id", rule.restaurant_id)
        .eq("status", "active");
        
      if (itemsError) {
        console.error(`Error fetching inventory for rule ${rule.id}:`, itemsError);
        continue;
      }
      
      // Filter items by food type (case-insensitive)
      const matchingItems = (items || []).filter(item => 
        item.product.toLowerCase() === rule.food_type.toLowerCase()
      );
      
      const activeCount = matchingItems.length;
      console.log(`Found ${activeCount} active ${rule.food_type} items, minimum required: ${rule.minimum_count}`);
      
      // If count is below minimum, create a notification and send an email
      if (activeCount < rule.minimum_count) {
        console.log(`Inventory level for ${rule.food_type} is below minimum threshold. Sending notification...`);
        
        // Create a notification record
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            restaurant_id: rule.restaurant_id,
            title: "Low Inventory Alert",
            message: `${rule.food_type} count (${activeCount}) is below the minimum requirement of ${rule.minimum_count}`,
            type: "warning",
            read: false,
            link: "/history"
          });
          
        if (notificationError) {
          console.error("Error creating notification:", notificationError);
        } else {
          console.log("Notification created successfully");
        }
        
        // Send email notification
        await sendEmailNotification(rule, activeCount);
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

// Function to send email notification
async function sendEmailNotification(rule: PrepWatchRule, currentCount: number) {
  try {
    // Call the send-prep-watch-notification edge function to send an email
    const response = await fetch(
      "https://htrstvloqgqvnvtiqfwa.functions.supabase.co/send-prep-watch-notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          restaurant_id: rule.restaurant_id,
          food_type: rule.food_type,
          current_count: currentCount,
          minimum_count: rule.minimum_count,
          notify_email: rule.notify_email
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }
    
    console.log(`Email notification sent to ${rule.notify_email} for ${rule.food_type}`);
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
}

