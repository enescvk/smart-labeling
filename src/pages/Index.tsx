
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { useQuery } from "@tanstack/react-query";
import { 
  getActiveInventoryItems, 
  getRecentItems, 
  getExpiringItems,
  getExpiredItems,
} from "../services/inventoryService";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { InventoryHeader } from "@/components/dashboard/InventoryHeader";
import { PageHeader } from "@/components/dashboard/PageHeader";

type FilterType = 'all' | 'active' | 'expiring' | 'expired';

const Index: React.FC = () => {
  const { selectedRestaurant } = useRestaurantStore();
  const [currentFilter, setCurrentFilter] = useState<FilterType>('active');
  
  console.log("Index page - Selected restaurant:", selectedRestaurant?.name, selectedRestaurant?.id);
  
  const { 
    data: activeItems = [], 
    isLoading: isLoadingActive 
  } = useQuery({
    queryKey: ['inventoryItems', 'active', selectedRestaurant?.id],
    queryFn: () => {
      console.log("Fetching active items for restaurant:", selectedRestaurant?.id);
      return getActiveInventoryItems(selectedRestaurant?.id);
    },
    enabled: !!selectedRestaurant
  });
  
  const { 
    data: recentItems = [], 
    isLoading: isLoadingRecent 
  } = useQuery({
    queryKey: ['inventoryItems', 'recent', selectedRestaurant?.id],
    queryFn: () => {
      console.log("Fetching recent items for restaurant:", selectedRestaurant?.id);
      return getRecentItems(selectedRestaurant?.id);
    },
    enabled: !!selectedRestaurant
  });
  
  const { 
    data: expiringItems = [], 
    isLoading: isLoadingExpiring 
  } = useQuery({
    queryKey: ['inventoryItems', 'expiring', selectedRestaurant?.id],
    queryFn: () => {
      console.log("Fetching expiring items for restaurant:", selectedRestaurant?.id);
      return getExpiringItems(selectedRestaurant?.id);
    },
    enabled: !!selectedRestaurant
  });
  
  const { 
    data: expiredItems = [], 
    isLoading: isLoadingExpired 
  } = useQuery({
    queryKey: ['inventoryItems', 'expired', selectedRestaurant?.id],
    queryFn: () => {
      console.log("Fetching expired items for restaurant:", selectedRestaurant?.id);
      return getExpiredItems(selectedRestaurant?.id);
    },
    enabled: !!selectedRestaurant
  });
  
  const isLoading = isLoadingActive || isLoadingRecent || isLoadingExpiring || isLoadingExpired;
  
  const activeItemsCount = activeItems.length;
  const usedItemsCount = 0;
  const totalItems = activeItemsCount + usedItemsCount;

  const getFilteredItems = () => {
    switch (currentFilter) {
      case 'active':
        return activeItems;
      case 'expiring':
        return expiringItems;
      case 'expired':
        return expiredItems;
      default: // 'all' case
        // Create a map to store unique items by ID to prevent duplicates
        const itemsMap = new Map();
        
        // Process each category of items
        const processItems = (items) => {
          items.forEach(item => {
            // If the item already exists in our map, only update it if it doesn't have profile data
            if (itemsMap.has(item.id)) {
              const existingItem = itemsMap.get(item.id);
              
              // If the current item has profile data but the existing one doesn't, update it
              if (item.preparedByProfile && (!existingItem.preparedByProfile || 
                 (!existingItem.preparedByProfile.first_name && !existingItem.preparedByProfile.last_name))) {
                itemsMap.set(item.id, item);
              }
            } else {
              // If the item doesn't exist in our map, add it
              itemsMap.set(item.id, item);
            }
          });
        };
        
        // Process each category of items in priority order
        // Active items likely have the most complete data
        processItems(activeItems);
        processItems(expiringItems);
        processItems(expiredItems);
        
        // Convert the map values back to an array
        return Array.from(itemsMap.values());
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
  };

  // Debug log to see which items are displayed
  console.log(`Index page - Showing ${getFilteredItems().length} items for restaurant: ${selectedRestaurant?.name}`);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <PageHeader />
        
        <StatsGrid
          totalItems={totalItems}
          activeItemsCount={activeItemsCount}
          expiringItemsCount={expiringItems.length}
          expiredItemsCount={expiredItems.length}
          isLoading={isLoading}
          onFilterChange={handleFilterChange}
          currentFilter={currentFilter}
        />
        
        <InventoryHeader items={getFilteredItems()} />
      </div>
    </Layout>
  );
};

export default Index;
