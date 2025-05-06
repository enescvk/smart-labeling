
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem, mapDatabaseItem } from "./types";
import { toast } from "sonner";

// Get all inventory items
export const getInventoryItems = async (restaurantId?: string | null): Promise<InventoryItem[]> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to getInventoryItems");
    return [];
  }

  console.log(`Fetching all inventory items for restaurant: ${restaurantId}`);
  
  try {
    // First, let's get the inventory items
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inventory items:", error);
      
      // Handle recursion policy errors
      if (error.message.includes("recursion") || error.message.includes("policy")) {
        toast.error("Database policy error detected. Please refresh the page.", {
          id: "inventory-recursion-error",
          duration: 5000,
        });
      }
      
      throw error; // Throw error so it can be caught and handled by React Query
    }

    console.log(`Found ${data?.length || 0} inventory items for restaurant ${restaurantId}`);
    
    if (!data || data.length === 0) {
      return [];
    }

    // Now get all the unique user IDs from the prepared_by field
    const userIds = [...new Set(data.map(item => item.prepared_by))];
    
    // Fetch profile information for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      // Continue with the inventory data even if profiles can't be fetched
    }
    
    // Create a map of user IDs to profile data for easier lookup
    const profilesMap = {};
    if (profilesData) {
      profilesData.forEach(profile => {
        profilesMap[profile.id] = profile;
      });
    }
    
    // Map the database items and add profile information
    const items = data.map(item => {
      return {
        ...mapDatabaseItem(item),
        preparedByProfile: profilesMap[item.prepared_by] || null
      };
    });
    
    console.log(`Processed ${items.length} inventory items for restaurant ${restaurantId}`);
    return items;
  } catch (err) {
    console.error("Unexpected error in getInventoryItems:", err);
    throw err; // Rethrow the error to be handled by the caller
  }
};

// Get active inventory items
export const getActiveInventoryItems = async (restaurantId?: string | null): Promise<InventoryItem[]> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to getActiveInventoryItems");
    return [];
  }

  console.log(`Fetching active inventory items for restaurant: ${restaurantId}`);
  
  try {
    // First, let's get the active inventory items
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("status", "active")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching active inventory items:", error);
      
      // Handle recursion policy errors
      if (error.message.includes("recursion") || error.message.includes("policy")) {
        toast.error("Database policy error detected. Please refresh the page.", {
          id: "inventory-recursion-error",
          duration: 5000,
        });
      }
      
      throw error; // Throw error to be caught and handled
    }

    console.log(`Found ${data?.length || 0} active inventory items for restaurant ${restaurantId}`);
    
    if (!data || data.length === 0) {
      return [];
    }

    // Now get all the unique user IDs from the prepared_by field
    const userIds = [...new Set(data.map(item => item.prepared_by))];
    
    // Fetch profile information for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      // Continue with the inventory data even if profiles can't be fetched
    }
    
    // Create a map of user IDs to profile data for easier lookup
    const profilesMap = {};
    if (profilesData) {
      profilesData.forEach(profile => {
        profilesMap[profile.id] = profile;
      });
    }
    
    // Map the database items and add profile information
    const items = data.map(item => {
      return {
        ...mapDatabaseItem(item),
        preparedByProfile: profilesMap[item.prepared_by] || null
      };
    });

    console.log(`Processed ${items.length} active inventory items for restaurant ${restaurantId}`);
    return items;
  } catch (err) {
    console.error("Unexpected error in getActiveInventoryItems:", err);
    throw err; // Rethrow the error
  }
};

// Get item by ID
export const getItemById = async (id: string, restaurantId?: string | null): Promise<InventoryItem | null> => {
  if (!restaurantId) {
    console.log("No restaurant ID provided to getItemById");
    return null;
  }

  console.log(`Fetching inventory item by ID: ${id} for restaurant: ${restaurantId}`);
  
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching inventory item:", error);
      
      // Handle recursion policy errors
      if (error.message.includes("recursion") || error.message.includes("policy")) {
        toast.error("Database policy error detected. Please refresh the page.", {
          id: "inventory-item-recursion-error",
          duration: 5000,
        });
      }
      
      throw error;
    }
    
    if (!data) {
      console.log(`No inventory item found with ID: ${id}`);
      return null;
    }
    
    // Get profile information for the preparer
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", data.prepared_by)
      .single();
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      // Continue with the inventory data even if profile can't be fetched
    }

    const item = mapDatabaseItem(data);
    
    // Add the profile information
    item.preparedByProfile = profileError ? null : profileData;

    console.log(`Found inventory item with ID: ${id} for restaurant ${restaurantId}`);
    return item;
  } catch (err) {
    console.error("Unexpected error in getItemById:", err);
    if (err.message?.includes('No rows returned')) {
      return null;
    }
    throw err;
  }
};
