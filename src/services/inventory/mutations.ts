
import { supabase } from "@/integrations/supabase/client";
import { getCurrentRestaurantId } from "@/services/restaurants/restaurantService";
import { InventoryItem, mapDatabaseItem } from "./types";

// Add inventory item
export const addInventoryItem = async (item: Omit<InventoryItem, "createdAt">): Promise<InventoryItem> => {
  try {
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId) {
      console.error("No restaurant ID available for creating inventory item");
      throw new Error("No restaurant selected");
    }

    console.log("Adding item to inventory with restaurant ID:", restaurantId);
    console.log("Item data:", item);

    const { data, error } = await supabase.from("inventory").insert({
      id: item.id,
      product: item.product,
      prepared_by: item.preparedBy,
      prepared_date: item.preparedDate,
      expiry_date: item.expiryDate,
      container_type: item.containerType,
      status: item.status,
      restaurant_id: restaurantId,
    }).select();

    if (error) {
      console.error("Supabase error adding inventory item:", error);
      throw new Error(`Database error: ${error.message || "Failed to add inventory item"}`);
    }

    if (!data || data.length === 0) {
      console.error("No data returned after adding inventory item");
      throw new Error("No data returned after adding inventory item");
    }

    console.log("Successfully added inventory item:", data[0]);
    return mapDatabaseItem(data[0]);
  } catch (error) {
    console.error("Exception in addInventoryItem:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error adding inventory item");
  }
};

// Update item status
export const updateItemStatus = async (id: string, status: "active" | "used"): Promise<void> => {
  const restaurantId = await getCurrentRestaurantId();
  if (!restaurantId) {
    throw new Error("No restaurant selected");
  }

  const { error } = await supabase
    .from("inventory")
    .update({ status })
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) {
    console.error("Error updating inventory item status:", error);
    throw error;
  }
};
