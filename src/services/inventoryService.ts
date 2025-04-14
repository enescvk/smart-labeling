
import { supabase } from "@/integrations/supabase/client";
import { getCurrentRestaurantId } from "@/services/restaurantService";

export interface InventoryItem {
  id: string;
  product: string;
  preparedBy: string;
  preparedDate: string;
  expiryDate: string;
  containerType: string;
  status: "active" | "used";
  createdAt: string;
  restaurantId?: string;
}

// Convert from database schema to client format
const mapDatabaseItem = (item: any): InventoryItem => {
  return {
    id: item.id,
    product: item.product,
    preparedBy: item.prepared_by,
    preparedDate: item.prepared_date,
    expiryDate: item.expiry_date,
    containerType: item.container_type || "Container",
    status: item.status,
    createdAt: item.created_at,
    restaurantId: item.restaurant_id,
  };
};

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

// Get items that are about to expire (within the next 2 days)
export const getExpiringItems = async (): Promise<InventoryItem[]> => {
  const restaurantId = await getCurrentRestaurantId();
  if (!restaurantId) {
    return [];
  }

  const items = await getActiveInventoryItems();
  const today = new Date();
  const twoDaysLater = new Date();
  twoDaysLater.setDate(today.getDate() + 2);

  return items.filter((item) => {
    const expiryDate = new Date(item.expiryDate);
    return (
      expiryDate > today &&
      expiryDate <= twoDaysLater
    );
  });
};

// Get recently created items (in the last 7 days)
export const getRecentItems = async (): Promise<InventoryItem[]> => {
  const restaurantId = await getCurrentRestaurantId();
  if (!restaurantId) {
    return [];
  }

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

  return data.map(mapDatabaseItem);
};

// Get expired items
export const getExpiredItems = async (): Promise<InventoryItem[]> => {
  const restaurantId = await getCurrentRestaurantId();
  if (!restaurantId) {
    return [];
  }

  const activeItems = await getActiveInventoryItems();
  const today = new Date();

  return activeItems.filter((item) => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate < today;
  });
};

// Add inventory item
export const addInventoryItem = async (item: Omit<InventoryItem, "createdAt">): Promise<InventoryItem> => {
  try {
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId) {
      throw new Error("No restaurant selected");
    }

    console.log("Adding item to inventory with restaurant ID:", restaurantId);

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
      throw new Error(error.message || "Failed to add inventory item");
    }

    if (!data || data.length === 0) {
      throw new Error("No data returned after adding inventory item");
    }

    console.log("Successfully added inventory item:", data[0]);
    return mapDatabaseItem(data[0]);
  } catch (error) {
    console.error("Exception in addInventoryItem:", error);
    throw error;
  }
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
