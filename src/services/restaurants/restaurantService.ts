
import { supabase } from "@/integrations/supabase/client";
import { Restaurant } from "./types";

// Get restaurants that the current user is a member of
export const getUserRestaurants = async (): Promise<Restaurant[]> => {
  try {
    console.log("Fetching user restaurants");
    
    // Get current user to confirm we have an authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("No authenticated user found:", userError);
      return [];
    }
    console.log("Current user:", user.id);
    
    // First get the restaurant IDs that the user has access to
    const { data: restaurantIds, error: idsError } = await supabase
      .rpc('get_user_restaurant_ids');
    
    if (idsError) {
      console.error("Error fetching user restaurant IDs:", idsError);
      throw new Error(idsError.message);
    }

    console.log("Restaurant IDs:", restaurantIds);
    if (!restaurantIds || restaurantIds.length === 0) {
      return [];
    }
    
    // Now fetch the actual restaurants using those IDs
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .in('id', restaurantIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching restaurants:", error);
      throw new Error(error.message);
    }

    console.log("Fetched restaurants:", restaurants);
    return restaurants || [];
  } catch (error) {
    console.error("Error in getUserRestaurants:", error);
    throw error;
  }
};

// Create a new restaurant and add current user as admin
export const createRestaurant = async (name: string): Promise<Restaurant> => {
  console.log("Creating restaurant with name:", name);
  try {
    const { data, error } = await supabase
      .rpc('create_restaurant_with_admin', {
        restaurant_name: name,
      });

    if (error) {
      console.error("Error creating restaurant:", error);
      throw new Error(error.message);
    }

    console.log("Restaurant created with ID:", data);
    
    // Now fetch the restaurant by ID to get the complete restaurant object
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error("Error fetching created restaurant:", fetchError);
      throw new Error(fetchError.message);
    }

    return restaurant;
  } catch (error) {
    console.error("Error in createRestaurant:", error);
    throw error;
  }
};

// Update restaurant name
export const updateRestaurant = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('restaurants')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error("Error updating restaurant:", error);
    throw new Error(error.message);
  }
};

// Get current restaurant name (most recently created/used)
export const getCurrentRestaurantName = async (): Promise<string | null> => {
  try {
    const restaurants = await getUserRestaurants();
    return restaurants.length > 0 ? restaurants[0].name : null;
  } catch (error) {
    console.error("Error in getCurrentRestaurantName:", error);
    return null;
  }
};

// Get the current restaurant ID (first one in the list)
export const getCurrentRestaurantId = async (): Promise<string | null> => {
  try {
    const restaurants = await getUserRestaurants();
    return restaurants.length > 0 ? restaurants[0].id : null;
  } catch (error) {
    console.error("Error in getCurrentRestaurantId:", error);
    return null;
  }
};
