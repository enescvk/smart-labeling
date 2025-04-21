
import { create } from 'zustand';
import { Restaurant } from '@/services/restaurants/types';
import { getUserRestaurants } from '@/services/restaurants/restaurantService';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantStore {
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  loadFirstRestaurant: () => Promise<void>;
  setDefaultRestaurant: (restaurantId: string) => Promise<void>;
  getDefaultRestaurant: () => Promise<string | null>;
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  selectedRestaurant: null,
  setSelectedRestaurant: (restaurant) => set({ selectedRestaurant: restaurant }),
  loadFirstRestaurant: async () => {
    try {
      // Get the user's restaurants
      const restaurants = await getUserRestaurants();
      
      if (restaurants && restaurants.length > 0) {
        // First try to get the default restaurant from local storage
        const defaultRestaurantId = await get().getDefaultRestaurant();
        console.log("Default restaurant ID from storage:", defaultRestaurantId);
        
        if (defaultRestaurantId) {
          // Find the default restaurant in the list
          const defaultRestaurant = restaurants.find(r => r.id === defaultRestaurantId);
          if (defaultRestaurant) {
            console.log("Setting default restaurant:", defaultRestaurant.name);
            set({ selectedRestaurant: defaultRestaurant });
            return;
          } else {
            console.log("Default restaurant not found among user restaurants");
          }
        }
        
        // If no default restaurant or not found, use the first one
        console.log("Using first restaurant as default:", restaurants[0].name);
        set({ selectedRestaurant: restaurants[0] });
      } else {
        console.log("No restaurants found for user");
      }
    } catch (error) {
      console.error("Failed to load first restaurant:", error);
    }
  },
  setDefaultRestaurant: async (restaurantId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");
      
      // Store the default restaurant preference in local storage
      localStorage.setItem(`default_restaurant_${user.id}`, restaurantId);
      console.log("Default restaurant saved:", restaurantId);
      return;
    } catch (error) {
      console.error("Failed to set default restaurant:", error);
      throw error;
    }
  },
  getDefaultRestaurant: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Get the default restaurant from local storage
      const defaultId = localStorage.getItem(`default_restaurant_${user.id}`);
      return defaultId;
    } catch (error) {
      console.error("Failed to get default restaurant:", error);
      return null;
    }
  }
}));
