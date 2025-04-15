
import { supabase } from "@/integrations/supabase/client";
import { getCurrentRestaurantId } from "@/services/restaurants/restaurantService";
import { InventoryItem, mapDatabaseItem } from "./types";

// Get all inventory items
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const restaurantId = await getCurrentRestaurantId();
  if (!restaurantId) {
    return [];
  }

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inventory items:", error);
    return [];
  }

  return data.map(mapDatabaseItem);
};

// Get active inventory items
export const getActiveInventoryItems = async (): Promise<InventoryItem[]> => {
  const restaurantId = await getCurrentRestaurantId();
  if (!restaurantId) {
    return [];
  }

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("status", "active")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching active inventory items:", error);
    return [];
  }

  return data.map(mapDatabaseItem);
};

// Get item by ID
export const getItemById = async (id: string): Promise<InventoryItem | null> => {
  const restaurantId = await getCurrentRestaurantId();
  if (!restaurantId) {
    return null;
  }

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

  return mapDatabaseItem(data);
};
