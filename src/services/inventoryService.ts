
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export interface InventoryItem {
  id: string;
  product: string;
  preparedBy: string;
  preparedDate: string;
  expiryDate: string;
  status: 'active' | 'used';
  createdAt: string;
}

// Transform from database format to app format
const transformDbItem = (item: any): InventoryItem => ({
  id: item.id,
  product: item.product,
  preparedBy: item.prepared_by,
  preparedDate: item.prepared_date,
  expiryDate: item.expiry_date,
  status: item.status,
  createdAt: item.created_at
});

// Transform from app format to database format
const transformToDbItem = (item: Omit<InventoryItem, 'createdAt'>) => ({
  id: item.id,
  product: item.product,
  prepared_by: item.preparedBy,
  prepared_date: item.preparedDate,
  expiry_date: item.expiryDate,
  status: item.status,
  created_at: new Date().toISOString()
});

// Get all inventory items
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }

  return data.map(transformDbItem);
};

// Get active inventory items
export const getActiveInventoryItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active inventory:', error);
    throw error;
  }

  return data.map(transformDbItem);
};

// Get recent items (last 5)
export const getRecentItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching recent items:', error);
    throw error;
  }

  return data.map(transformDbItem);
};

// Get items expiring soon (active items sorted by closest expiry date)
export const getExpiringItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .order('expiry_date', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Error fetching expiring items:', error);
    throw error;
  }

  return data.map(transformDbItem);
};

// Add an item to inventory
export const addInventoryItem = async (item: Omit<InventoryItem, 'createdAt'>): Promise<InventoryItem> => {
  const dbItem = transformToDbItem(item);
  
  const { data, error } = await supabase
    .from('inventory')
    .insert(dbItem)
    .select()
    .single();

  if (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }

  return transformDbItem(data);
};

// Update an item's status
export const updateItemStatus = async (id: string, status: 'active' | 'used'): Promise<void> => {
  const { error } = await supabase
    .from('inventory')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating item status:', error);
    throw error;
  }
};

// Get an item by ID
export const getItemById = async (id: string): Promise<InventoryItem | null> => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return null;
    }
    console.error('Error fetching item by ID:', error);
    throw error;
  }

  return transformDbItem(data);
};
