
import { create } from 'zustand';
import { Restaurant } from '@/services/restaurants/types';

interface RestaurantStore {
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
}

export const useRestaurantStore = create<RestaurantStore>((set) => ({
  selectedRestaurant: null,
  setSelectedRestaurant: (restaurant) => set({ selectedRestaurant: restaurant }),
}));
