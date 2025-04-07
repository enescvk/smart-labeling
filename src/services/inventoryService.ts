
import { format, addDays, parseISO, subMonths } from "date-fns";
import { mockInventory, InventoryItem, generateMockInventory } from "../utils/mockData";

// Create a copy of the mock inventory to avoid modifying the original
const inventoryData: InventoryItem[] = [...mockInventory];

// Functions to retrieve different inventory item groups
export const getActiveInventoryItems = (): InventoryItem[] => {
  return inventoryData.filter(item => item.status === 'active');
};

export const getExpiredItems = (): InventoryItem[] => {
  const today = new Date();
  return inventoryData.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate < today;
  });
};

export const getRecentItems = (): InventoryItem[] => {
  return [...inventoryData].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);
};

export const getExpiringItems = (): InventoryItem[] => {
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  return inventoryData.filter(item => {
    if (item.status !== 'active') return false;
    
    const expiryDate = new Date(item.expiryDate);
    return expiryDate > today && expiryDate <= nextWeek;
  });
};

// Export the InventoryItem type
export type { InventoryItem };
