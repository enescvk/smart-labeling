
import { supabase } from "@/integrations/supabase/client";

export interface RestaurantSettings {
  restaurant_id: string;
  container_types: string[];
  created_at?: string;
  updated_at?: string;
}

// Get restaurant settings
export const getRestaurantSettings = async (restaurantId: string): Promise<RestaurantSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return default settings
        return {
          restaurant_id: restaurantId,
          container_types: ['Container', 'Bottle', 'Jar', 'Bag', 'Box', 'Other']
        };
      }
      console.error("Error fetching restaurant settings:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getRestaurantSettings:", error);
    throw error;
  }
};

// Update container types
export const updateContainerTypes = async (
  restaurantId: string, 
  containerTypes: string[]
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('restaurant_settings')
      .upsert({
        restaurant_id: restaurantId,
        container_types: containerTypes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'restaurant_id'
      });

    if (error) {
      console.error("Error updating container types:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in updateContainerTypes:", error);
    throw error;
  }
};
