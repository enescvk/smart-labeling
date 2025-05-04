import { create } from 'zustand';
import { Restaurant } from '@/services/restaurants/types';
import { getUserRestaurants } from '@/services/restaurants/restaurantService';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantStore {
  selectedRestaurant: Restaurant | null;
  isLoading: boolean;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  loadFirstRestaurant: () => Promise<void>;
  setDefaultRestaurant: (restaurantId: string) => Promise<void>;
  getDefaultRestaurant: () => Promise<string | null>;
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  selectedRestaurant: null,
  isLoading: false,
  setSelectedRestaurant: (restaurant) => set({ selectedRestaurant: restaurant }),
  
  loadFirstRestaurant: async () => {
    try {
      set({ isLoading: true });
      console.log("Restaurant store: Loading first restaurant");
      
      // Get the user's restaurants
      const restaurants = await getUserRestaurants();
      
      if (restaurants && restaurants.length > 0) {
        // First try to get the default restaurant from the database
        const defaultRestaurantId = await get().getDefaultRestaurant();
        console.log("Default restaurant ID from database:", defaultRestaurantId);
        
        if (defaultRestaurantId) {
          // Find the default restaurant in the list
          const defaultRestaurant = restaurants.find(r => r.id === defaultRestaurantId);
          if (defaultRestaurant) {
            console.log("Found and setting default restaurant:", defaultRestaurant.name);
            set({ selectedRestaurant: defaultRestaurant, isLoading: false });
            return;
          } else {
            console.log("Default restaurant not found among user restaurants, ID was:", defaultRestaurantId);
          }
        }
        
        // If no default restaurant or not found, use the first one
        console.log("Using first restaurant as default:", restaurants[0].name);
        set({ selectedRestaurant: restaurants[0], isLoading: false });
      } else {
        console.log("No restaurants found for user");
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to load first restaurant:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  setDefaultRestaurant: async (restaurantId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");
      
      // Upsert the user's default restaurant preference
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          default_restaurant_id: restaurantId 
        }, { 
          onConflict: 'user_id' 
        });
      
      if (error) {
        console.error("Failed to set default restaurant:", error);
        throw error;
      }
      
      console.log("Default restaurant saved for user:", user.id, "restaurant:", restaurantId);
    } catch (error) {
      console.error("Failed to set default restaurant:", error);
      throw error;
    }
  },
  
  getDefaultRestaurant: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Fetch the user's default restaurant from the database
      const { data, error } = await supabase
        .from('user_preferences')
        .select('default_restaurant_id')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching default restaurant:", error);
        return null;
      }
      
      console.log("Retrieved default restaurant from database:", data?.default_restaurant_id);
      return data?.default_restaurant_id;
    } catch (error) {
      console.error("Failed to get default restaurant:", error);
      return null;
    }
  }
}));
