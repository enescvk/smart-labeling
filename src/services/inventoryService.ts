
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export interface InventoryItem {
  id: string;
  product: string;
  preparedBy: string;
  preparedDate: string;
  expiryDate: string;
  status: 'active' | 'used';
  containerType: string;
  createdAt: string;
  restaurantId?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantMember {
  id: string;
  userId: string;
  restaurantId: string;
  role: 'admin' | 'staff';
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
  };
}

// Transform from database format to app format
const transformDbItem = (item: any): InventoryItem => ({
  id: item.id,
  product: item.product,
  preparedBy: item.prepared_by,
  preparedDate: item.prepared_date,
  expiryDate: item.expiry_date,
  status: item.status,
  containerType: item.container_type || 'Container',
  createdAt: item.created_at,
  restaurantId: item.restaurant_id
});

// Transform from app format to database format
const transformToDbItem = (item: Omit<InventoryItem, 'createdAt'>) => ({
  id: item.id,
  product: item.product,
  prepared_by: item.preparedBy,
  prepared_date: item.preparedDate,
  expiry_date: item.expiryDate,
  status: item.status,
  container_type: item.containerType,
  restaurant_id: item.restaurantId,
  created_at: new Date().toISOString()
});

// Get all inventory items
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  console.log('Fetching all inventory items');
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }

    console.log('Retrieved inventory items:', data);
    return data ? data.map(transformDbItem) : [];
  } catch (err) {
    console.error('Exception in getInventoryItems:', err);
    return [];
  }
};

// Get active inventory items
export const getActiveInventoryItems = async (): Promise<InventoryItem[]> => {
  console.log('Fetching active inventory items');
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active inventory:', error);
      throw error;
    }

    console.log('Retrieved active items:', data);
    return data ? data.map(transformDbItem) : [];
  } catch (err) {
    console.error('Exception in getActiveInventoryItems:', err);
    return [];
  }
};

// Get recent items (last 5)
export const getRecentItems = async (): Promise<InventoryItem[]> => {
  console.log('Fetching recent items');
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent items:', error);
      throw error;
    }

    console.log('Retrieved recent items:', data);
    return data ? data.map(transformDbItem) : [];
  } catch (err) {
    console.error('Exception in getRecentItems:', err);
    return [];
  }
};

// Get items expiring soon (active items that are not expired but expiring soon)
export const getExpiringItems = async (): Promise<InventoryItem[]> => {
  console.log('Fetching expiring items');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formattedToday = today.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('status', 'active')
      .gte('expiry_date', formattedToday) // Only get items expiring today or in the future
      .order('expiry_date', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching expiring items:', error);
      throw error;
    }

    console.log('Retrieved expiring items:', data);
    return data ? data.map(transformDbItem) : [];
  } catch (err) {
    console.error('Exception in getExpiringItems:', err);
    return [];
  }
};

// Get expired items (active items with expiry date in the past)
export const getExpiredItems = async (): Promise<InventoryItem[]> => {
  console.log('Fetching expired items');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formattedToday = today.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('status', 'active')
      .lt('expiry_date', formattedToday) // Only get items expired (before today)
      .order('expiry_date', { ascending: false });

    if (error) {
      console.error('Error fetching expired items:', error);
      throw error;
    }

    console.log('Retrieved expired items:', data);
    return data ? data.map(transformDbItem) : [];
  } catch (err) {
    console.error('Exception in getExpiredItems:', err);
    return [];
  }
};

// Add an item to inventory
export const addInventoryItem = async (item: Omit<InventoryItem, 'createdAt'>): Promise<InventoryItem> => {
  console.log('Adding item to inventory:', item);
  const dbItem = transformToDbItem(item);
  
  try {
    const { data, error } = await supabase
      .from('inventory')
      .insert(dbItem)
      .select()
      .single();

    if (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }

    console.log('Item added successfully:', data);
    return transformDbItem(data);
  } catch (err) {
    console.error('Exception in addInventoryItem:', err);
    throw err;
  }
};

// Update an item's status
export const updateItemStatus = async (id: string, status: 'active' | 'used'): Promise<void> => {
  console.log(`Updating item ${id} status to ${status}`);
  try {
    const { error } = await supabase
      .from('inventory')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating item status:', error);
      throw error;
    }
    
    console.log(`Item ${id} status updated successfully`);
  } catch (err) {
    console.error('Exception in updateItemStatus:', err);
    throw err;
  }
};

// Get an item by ID
export const getItemById = async (id: string): Promise<InventoryItem | null> => {
  console.log(`Fetching item with ID: ${id}`);
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        console.log(`No item found with ID: ${id}`);
        return null;
      }
      console.error('Error fetching item by ID:', error);
      throw error;
    }

    console.log(`Retrieved item: ${id}`, data);
    return transformDbItem(data);
  } catch (err) {
    console.error('Exception in getItemById:', err);
    return null;
  }
};

// Restaurant related functions
export const createRestaurant = async (name: string): Promise<Restaurant | null> => {
  console.log('Creating restaurant:', name);
  try {
    const { data, error } = await supabase
      .rpc('create_restaurant_with_admin', { restaurant_name: name });

    if (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }

    // Get the newly created restaurant details
    const restaurantId = data;
    const restaurantResponse = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (restaurantResponse.error) {
      console.error('Error fetching created restaurant:', restaurantResponse.error);
      throw restaurantResponse.error;
    }

    console.log('Restaurant created successfully:', restaurantResponse.data);
    return {
      id: restaurantResponse.data.id,
      name: restaurantResponse.data.name,
      createdAt: restaurantResponse.data.created_at,
      updatedAt: restaurantResponse.data.updated_at
    };
  } catch (err) {
    console.error('Exception in createRestaurant:', err);
    return null;
  }
};

export const getUserRestaurants = async (): Promise<Restaurant[]> => {
  console.log('Fetching user restaurants');
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }

    console.log('Retrieved restaurants:', data);
    return data ? data.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      createdAt: restaurant.created_at,
      updatedAt: restaurant.updated_at
    })) : [];
  } catch (err) {
    console.error('Exception in getUserRestaurants:', err);
    return [];
  }
};

export const updateRestaurant = async (id: string, name: string): Promise<Restaurant | null> => {
  console.log(`Updating restaurant ${id} name to ${name}`);
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating restaurant:', error);
      throw error;
    }

    console.log('Restaurant updated successfully:', data);
    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (err) {
    console.error('Exception in updateRestaurant:', err);
    return null;
  }
};

export const getRestaurantMembers = async (restaurantId: string): Promise<RestaurantMember[]> => {
  console.log(`Fetching members for restaurant ${restaurantId}`);
  try {
    const { data, error } = await supabase
      .from('restaurant_members')
      .select('*, user:user_id(email)')
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Error fetching restaurant members:', error);
      throw error;
    }

    console.log('Retrieved restaurant members:', data);
    return data ? data.map(member => ({
      id: member.id,
      userId: member.user_id,
      restaurantId: member.restaurant_id,
      role: member.role,
      createdAt: member.created_at,
      updatedAt: member.updated_at,
      user: member.user ? { email: member.user.email } : undefined
    })) : [];
  } catch (err) {
    console.error('Exception in getRestaurantMembers:', err);
    return [];
  }
};

export const addRestaurantMember = async (restaurantId: string, email: string, role: 'admin' | 'staff'): Promise<RestaurantMember | null> => {
  console.log(`Adding member with email ${email} to restaurant ${restaurantId} with role ${role}`);
  try {
    // First get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Error finding user by email:', userError);
      throw userError;
    }

    if (!userData) {
      console.error('No user found with email:', email);
      throw new Error(`No user found with email: ${email}`);
    }

    // Add the user as a member
    const { data, error } = await supabase
      .from('restaurant_members')
      .insert({
        restaurant_id: restaurantId,
        user_id: userData.id,
        role
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding restaurant member:', error);
      throw error;
    }

    console.log('Restaurant member added successfully:', data);
    return {
      id: data.id,
      userId: data.user_id,
      restaurantId: data.restaurant_id,
      role: data.role,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      user: { email }
    };
  } catch (err) {
    console.error('Exception in addRestaurantMember:', err);
    return null;
  }
};

export const removeRestaurantMember = async (memberId: string): Promise<boolean> => {
  console.log(`Removing restaurant member ${memberId}`);
  try {
    const { error } = await supabase
      .from('restaurant_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing restaurant member:', error);
      throw error;
    }

    console.log('Restaurant member removed successfully');
    return true;
  } catch (err) {
    console.error('Exception in removeRestaurantMember:', err);
    return false;
  }
};

export const isRestaurantAdmin = async (restaurantId: string): Promise<boolean> => {
  console.log(`Checking if user is admin for restaurant ${restaurantId}`);
  try {
    const { data, error } = await supabase
      .rpc('is_restaurant_admin', { restaurant_id: restaurantId });

    if (error) {
      console.error('Error checking restaurant admin status:', error);
      throw error;
    }

    console.log('Restaurant admin check result:', data);
    return !!data;
  } catch (err) {
    console.error('Exception in isRestaurantAdmin:', err);
    return false;
  }
};
