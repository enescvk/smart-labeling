
import { format, addDays } from "date-fns";

export interface InventoryItem {
  id: string;
  product: string;
  preparedBy: string;
  preparedDate: string;
  expiryDate: string;
  status: 'active' | 'used';
  createdAt: string;
}

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
  'BBQ Sauce'
];

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

// Initial mock data (12 items)
export const mockInventory: InventoryItem[] = generateMockInventory(12);

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
