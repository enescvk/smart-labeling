
import React from "react";
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

const Index: React.FC = () => {
  const { selectedRestaurant } = useRestaurantStore();
  
  const { 
    data: activeItems = [], 
    isLoading: isLoadingActive 
  } = useQuery({
    queryKey: ['inventoryItems', 'active', selectedRestaurant?.id],
    queryFn: () => getActiveInventoryItems(selectedRestaurant?.id),
    enabled: !!selectedRestaurant
  });
  
  const { 
    data: recentItems = [], 
    isLoading: isLoadingRecent 
  } = useQuery({
    queryKey: ['inventoryItems', 'recent', selectedRestaurant?.id],
    queryFn: () => getRecentItems(selectedRestaurant?.id),
    enabled: !!selectedRestaurant
  });
  
  const { 
    data: expiringItems = [], 
    isLoading: isLoadingExpiring 
  } = useQuery({
    queryKey: ['inventoryItems', 'expiring', selectedRestaurant?.id],
    queryFn: () => getExpiringItems(selectedRestaurant?.id),
    enabled: !!selectedRestaurant
  });
  
  const { 
    data: expiredItems = [], 
    isLoading: isLoadingExpired 
  } = useQuery({
    queryKey: ['inventoryItems', 'expired', selectedRestaurant?.id],
    queryFn: () => getExpiredItems(selectedRestaurant?.id),
    enabled: !!selectedRestaurant
  });
  
  const isLoading = isLoadingActive || isLoadingRecent || isLoadingExpiring || isLoadingExpired;
  
  const activeItemsCount = activeItems.length;
  const usedItemsCount = 0;
  const totalItems = activeItemsCount + usedItemsCount;

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
        />
        
        <InventoryHeader />
      </div>
    </Layout>
  );
};

export default Index;
