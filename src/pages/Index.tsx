
import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type FilterType = 'active' | 'expiring' | 'expired';

const Index: React.FC = () => {
  const { selectedRestaurant } = useRestaurantStore();
  const [currentFilter, setCurrentFilter] = useState<FilterType>('active');
  
  console.log("Index page - Selected restaurant:", selectedRestaurant?.name, selectedRestaurant?.id);
  
  useEffect(() => {
    // Verify the user has the correct permissions
    const checkPermissions = async () => {
      if (selectedRestaurant?.id) {
        try {
          const { data, error } = await supabase.from("inventory")
            .select("id")
            .eq("restaurant_id", selectedRestaurant.id)
            .limit(1);
            
          if (error) {
            console.error("Permission check error:", error);
            toast.error("Permission issue: " + error.message);
          } else {
            console.log("Permission check passed, found items:", data?.length || 0);
          }
        } catch (err) {
          console.error("Unexpected error in permission check:", err);
        }
      }
    };
    
    checkPermissions();
  }, [selectedRestaurant]);
  
  useEffect(() => {
    // Log when the selected restaurant changes
    console.log("Restaurant changed:", selectedRestaurant?.id, selectedRestaurant?.name);
  }, [selectedRestaurant]);
  
  const { 
    data: activeItems = [], 
    isLoading: isLoadingActive,
    error: activeError 
  } = useQuery({
    queryKey: ['inventoryItems', 'active', selectedRestaurant?.id],
    queryFn: () => {
      console.log("Fetching active items for restaurant:", selectedRestaurant?.id);
      return getActiveInventoryItems(selectedRestaurant?.id);
    },
    enabled: !!selectedRestaurant?.id,
    retry: 2,
    staleTime: 30000
  });
  
  // Log errors if any
  useEffect(() => {
    if (activeError) {
      console.error("Error fetching active items:", activeError);
      toast.error("Failed to fetch inventory items");
    }
  }, [activeError]);
  
  const { 
    data: recentItems = [], 
    isLoading: isLoadingRecent,
    error: recentError
  } = useQuery({
    queryKey: ['inventoryItems', 'recent', selectedRestaurant?.id],
    queryFn: () => {
      console.log("Fetching recent items for restaurant:", selectedRestaurant?.id);
      return getRecentItems(selectedRestaurant?.id);
    },
    enabled: !!selectedRestaurant?.id,
    retry: 2
  });
  
  const { 
    data: expiringItems = [], 
    isLoading: isLoadingExpiring,
    error: expiringError
  } = useQuery({
    queryKey: ['inventoryItems', 'expiring', selectedRestaurant?.id],
    queryFn: () => {
      console.log("Fetching expiring items for restaurant:", selectedRestaurant?.id);
      return getExpiringItems(selectedRestaurant?.id);
    },
    enabled: !!selectedRestaurant?.id,
    retry: 2
  });
  
  const { 
    data: expiredItems = [], 
    isLoading: isLoadingExpired,
    error: expiredError
  } = useQuery({
    queryKey: ['inventoryItems', 'expired', selectedRestaurant?.id],
    queryFn: () => {
      console.log("Fetching expired items for restaurant:", selectedRestaurant?.id);
      return getExpiredItems(selectedRestaurant?.id);
    },
    enabled: !!selectedRestaurant?.id,
    retry: 2
  });
  
  const isLoading = isLoadingActive || isLoadingRecent || isLoadingExpiring || isLoadingExpired;
  
  // Determine current error based on filter
  const getCurrentError = () => {
    switch(currentFilter) {
      case 'active': return activeError;
      case 'expiring': return expiringError;
      case 'expired': return expiredError;
      default: return activeError;
    }
  };

  const getFilteredItems = () => {
    // Log current data state
    console.log("Active items:", activeItems?.length);
    console.log("Expiring items:", expiringItems?.length);
    console.log("Expired items:", expiredItems?.length);
    
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
          if (!items || !items.length) return;
          
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
    console.log("Filter changed to:", filter);
    setCurrentFilter(filter);
  };

  // Debug log to see which items are displayed
  const filteredItems = getFilteredItems();
  console.log(`Index page - Showing ${filteredItems?.length || 0} items for restaurant: ${selectedRestaurant?.name}`);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <PageHeader />
        
        <StatsGrid
          activeItemsCount={activeItems?.length || 0}
          expiringItemsCount={expiringItems?.length || 0}
          expiredItemsCount={expiredItems?.length || 0}
          isLoading={isLoading}
          onFilterChange={handleFilterChange}
          currentFilter={currentFilter}
        />
        
        <InventoryHeader 
          items={filteredItems || []} 
          isLoading={isLoading}
          error={getCurrentError()}
        />
      </div>
    </Layout>
  );
};

export default Index;
