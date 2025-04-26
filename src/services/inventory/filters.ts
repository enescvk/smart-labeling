
import { InventoryItem } from "./types";
import { getActiveInventoryItems } from "./queries";
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseItem } from "./types";

// Get items that are about to expire (within the next 2 days)
export const getExpiringItems = async (restaurantId?: string | null): Promise<InventoryItem[]> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to getExpiringItems");
    return [];
  }

  console.log(`Fetching expiring items for restaurant: ${restaurantId}`);
  const today = new Date();
  const twoDaysLater = new Date();
  twoDaysLater.setDate(today.getDate() + 2);
  
  // Directly query the database rather than filtering client-side
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", "active")
    .lte("expiry_date", twoDaysLater.toISOString())
    .gte("expiry_date", today.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching expiring inventory items:", error);
    return [];
  }

  console.log(`Found ${data?.length || 0} expiring items for restaurant ${restaurantId}`);
  return data.map(mapDatabaseItem);
};

// Get expired items
export const getExpiredItems = async (restaurantId?: string | null): Promise<InventoryItem[]> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to getExpiredItems");
    return [];
  }

  console.log(`Fetching expired items for restaurant: ${restaurantId}`);
  const today = new Date();
  
  // Directly query the database rather than filtering client-side
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", "active")
    .lt("expiry_date", today.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching expired inventory items:", error);
    return [];
  }

  console.log(`Found ${data?.length || 0} expired items for restaurant ${restaurantId}`);
  return data.map(mapDatabaseItem);
};

// Get recently created items (in the last 7 days)
export const getRecentItems = async (restaurantId?: string | null): Promise<InventoryItem[]> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to getRecentItems");
    return [];
  }

  console.log(`Fetching recent items for restaurant: ${restaurantId}`);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recent inventory items:", error);
    return [];
  }

  console.log(`Found ${data?.length || 0} recent items for restaurant ${restaurantId}`);
  return data.map(mapDatabaseItem);
};
