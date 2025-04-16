
import { create } from 'zustand';
import { Restaurant } from '@/services/restaurants/types';
import { getUserRestaurants } from '@/services/restaurants/restaurantService';

interface RestaurantStore {
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  loadFirstRestaurant: () => Promise<void>;
}

export const useRestaurantStore = create<RestaurantStore>((set) => ({
  selectedRestaurant: null,
  setSelectedRestaurant: (restaurant) => set({ selectedRestaurant: restaurant }),
  loadFirstRestaurant: async () => {
    try {
      const restaurants = await getUserRestaurants();
      if (restaurants && restaurants.length > 0) {
        set({ selectedRestaurant: restaurants[0] });
        return;
      }
    } catch (error) {
      console.error("Failed to load first restaurant:", error);
    }
  }
}));
