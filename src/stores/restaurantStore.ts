
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
      // First try to get the default restaurant from local storage
      const defaultRestaurantId = await get().getDefaultRestaurant();
      
      const restaurants = await getUserRestaurants();
      if (restaurants && restaurants.length > 0) {
        if (defaultRestaurantId) {
          // Find the default restaurant in the list
          const defaultRestaurant = restaurants.find(r => r.id === defaultRestaurantId);
          if (defaultRestaurant) {
            set({ selectedRestaurant: defaultRestaurant });
            return;
          }
        }
        
        // If no default restaurant or not found, use the first one
        set({ selectedRestaurant: restaurants[0] });
        return;
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
      return localStorage.getItem(`default_restaurant_${user.id}`);
    } catch (error) {
      console.error("Failed to get default restaurant:", error);
      return null;
    }
  }
}));
