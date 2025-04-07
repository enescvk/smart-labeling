
import { format, addDays, parseISO, subDays } from "date-fns";

export interface InventoryItem {
  id: string;
  product: string;
  preparedBy: string;
  preparedDate: string;
  expiryDate: string;
  status: 'active' | 'used';
  createdAt: string;
}

// Staff names
const staffNames = [
  'Alex Kim',
  'Jamie Rodriguez',
  'Taylor Smith',
  'Morgan Chen',
  'Jordan Lee'
];

// Product names
const products = [
  'Chicken Stock',
  'Beef Gravy',
  'Diced Tomatoes',
  'Chopped Garlic',
  'Sliced Onions',
  'Mixed Herbs',
  'Sliced Bell Peppers',
  'Diced Potatoes',
  'Grated Cheese',
  'Pasta Sauce',
  'Chopped Cilantro',
  'Lemon Juice',
  'Olive Oil Mix',
  'Mayonnaise',
  'BBQ Sauce',
  'Cumin' // Added Cumin to the product list
];

// Generate a random date in the future (1-7 days)
const getRandomFutureDate = (baseDate: Date = new Date()): string => {
  const daysToAdd = Math.floor(Math.random() * 7) + 1;
  return format(addDays(baseDate, daysToAdd), 'yyyy-MM-dd');
};

// Generate a random date in the past (1-7 days)
const getRandomPastDate = (): string => {
  const daysToSubtract = Math.floor(Math.random() * 7) + 1;
  return format(addDays(new Date(), -daysToSubtract), 'yyyy-MM-dd');
};

// Generate a random inventory item
const generateRandomItem = (id: string, status: 'active' | 'used' = 'active'): InventoryItem => {
  const today = new Date();
  const preparedDate = status === 'active' ? format(today, 'yyyy-MM-dd') : getRandomPastDate();
  
  return {
    id,
    product: products[Math.floor(Math.random() * products.length)],
    preparedBy: staffNames[Math.floor(Math.random() * staffNames.length)],
    preparedDate,
    expiryDate: status === 'active' ? getRandomFutureDate(today) : getRandomPastDate(),
    status,
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  };
};

// Generate mock inventory data
export const generateMockInventory = (count: number): InventoryItem[] => {
  const items: InventoryItem[] = [];
  
  // Generate active items (70% of total)
  const activeCount = Math.floor(count * 0.7);
  for (let i = 0; i < activeCount; i++) {
    items.push(generateRandomItem(`a${i+1}`, 'active'));
  }
  
  // Generate used items (30% of total)
  const usedCount = count - activeCount;
  for (let i = 0; i < usedCount; i++) {
    items.push(generateRandomItem(`u${i+1}`, 'used'));
  }
  
  return items;
};

// Function to generate Cumin data for March 2025
const generateCuminData = (): InventoryItem[] => {
  const cuminItems: InventoryItem[] = [];
  const march2025 = new Date(2025, 2, 1); // March is month 2 (0-indexed)
  
  for (let i = 0; i < 20; i++) {
    // Generate a random day in March (1-31)
    const day = Math.floor(Math.random() * 31) + 1;
    const prepDay = Math.min(day, 28); // Ensure prepared date is in March
    const expDay = Math.min(day + 3, 31); // Expiration a few days later
    
    // Create prepared and expiry dates
    const preparedDate = `2025-03-${prepDay.toString().padStart(2, '0')}`;
    const expiryDate = `2025-03-${expDay.toString().padStart(2, '0')}`;
    
    // Create createdAt timestamp with time
    const createdAt = `2025-03-${prepDay.toString().padStart(2, '0')} ${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
    
    // Random staff
    const preparedBy = staffNames[Math.floor(Math.random() * staffNames.length)];
    
    // Create the item
    cuminItems.push({
      id: `cumin-${i+1}`,
      product: 'Cumin',
      preparedBy,
      preparedDate,
      expiryDate,
      status: 'active',
      createdAt
    });
  }
  
  return cuminItems;
};

// Initial mock data (12 items)
export const mockInventory: InventoryItem[] = [
  ...generateMockInventory(12),
  ...generateCuminData() // Add 20 Cumin items
];

// Get recent items (last 5)
export const getRecentItems = (): InventoryItem[] => {
  return [...mockInventory].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);
};

// Get items expiring soon (active items sorted by closest expiry date)
export const getExpiringItems = (): InventoryItem[] => {
  return [...mockInventory]
    .filter(item => item.status === 'active')
    .sort((a, b) => 
      new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    )
    .slice(0, 5);
};

// Get expired items
export const getExpiredItems = (): InventoryItem[] => {
  const today = new Date();
  return mockInventory.filter(item => new Date(item.expiryDate) < today);
};

// Get active inventory items
export const getActiveInventoryItems = (): InventoryItem[] => {
  return mockInventory.filter(item => item.status === 'active');
};
