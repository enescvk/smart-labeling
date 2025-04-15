
import { InventoryItem } from "./types";
import { getActiveInventoryItems } from "./queries";

// Get items that are about to expire (within the next 2 days)
export const getExpiringItems = async (): Promise<InventoryItem[]> => {
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

// Get expired items
export const getExpiredItems = async (): Promise<InventoryItem[]> => {
  const activeItems = await getActiveInventoryItems();
  const today = new Date();

  return activeItems.filter((item) => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate < today;
  });
};

// Get recently created items (in the last 7 days)
export const getRecentItems = async (): Promise<InventoryItem[]> => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { getCurrentRestaurantId } = await import("@/services/restaurants/restaurantService");
  const { mapDatabaseItem } = await import("./types");

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
