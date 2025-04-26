
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem, mapDatabaseItem } from "./types";

// Get all inventory items
export const getInventoryItems = async (restaurantId?: string | null): Promise<InventoryItem[]> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to getInventoryItems");
    return [];
  }

  console.log(`Fetching all inventory items for restaurant: ${restaurantId}`);
  const { data, error } = await supabase
    .from("inventory")
    .select(`
      *,
      profiles:prepared_by (
        first_name,
        last_name
      )
    `)
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inventory items:", error);
    return [];
  }

  console.log(`Found ${data?.length || 0} inventory items for restaurant ${restaurantId}`);
  return data.map(mapDatabaseItem);
};

// Get active inventory items
export const getActiveInventoryItems = async (restaurantId?: string | null): Promise<InventoryItem[]> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to getActiveInventoryItems");
    return [];
  }

  console.log(`Fetching active inventory items for restaurant: ${restaurantId}`);
  const { data, error } = await supabase
    .from("inventory")
    .select(`
      *,
      profiles:prepared_by (
        first_name,
        last_name
      )
    `)
    .eq("status", "active")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching active inventory items:", error);
    return [];
  }

  console.log(`Found ${data?.length || 0} active inventory items for restaurant ${restaurantId}`);
  return data.map(mapDatabaseItem);
};

// Get item by ID
export const getItemById = async (id: string, restaurantId?: string | null): Promise<InventoryItem | null> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to getItemById");
    return null;
  }

  console.log(`Fetching inventory item by ID: ${id} for restaurant: ${restaurantId}`);
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .single();

  if (error) {
    console.error("Error fetching inventory item:", error);
    return null;
  }

  console.log(`Found inventory item with ID: ${id} for restaurant ${restaurantId}`);
  return mapDatabaseItem(data);
};
