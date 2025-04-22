
import { supabase } from "@/integrations/supabase/client";

export interface RestaurantFoodTypes {
  restaurant_id: string;
  food_types: string[];
  created_at?: string;
  updated_at?: string;
}

export const getRestaurantFoodTypes = async (restaurantId: string): Promise<RestaurantFoodTypes | null> => {
  try {
    const { data, error } = await supabase
      .from("restaurant_food_types")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();
    if (error) {
      console.error("Error fetching food types:", error);
      throw error;
    }
    // Provide default food types if missing
    if (!data) {
      return {
        restaurant_id: restaurantId,
        food_types: ['Main Course', 'Appetizer', 'Dessert', 'Beverage', 'Side Dish'],
      };
    }
    return data;
  } catch (error) {
    console.error("Error in getRestaurantFoodTypes:", error);
    throw error;
  }
};

export const updateRestaurantFoodTypes = async (
  restaurantId: string,
  foodTypes: string[]
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("restaurant_food_types")
      .upsert(
        {
          restaurant_id: restaurantId,
          food_types: foodTypes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "restaurant_id" }
      );
    if (error) {
      console.error("Error updating food types:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in updateRestaurantFoodTypes:", error);
    throw error;
  }
};
