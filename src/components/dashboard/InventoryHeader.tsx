
import React, { useEffect } from "react";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { InventoryCard } from "@/components/InventoryCard";
import { InventoryItem } from "@/services/inventory/types";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryHeaderProps {
  items: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({ items, isLoading, error }) => {
  const { selectedRestaurant } = useRestaurantStore();
  
  useEffect(() => {
    console.log("InventoryHeader - mounted/updated with:", {
      itemsCount: items?.length || 0,
      restaurantId: selectedRestaurant?.id,
      restaurantName: selectedRestaurant?.name,
      isLoading,
      hasError: !!error,
      errorMessage: error?.message
    });
    
    return () => {
      console.log("InventoryHeader - unmounting");
    };
  }, [items, selectedRestaurant, isLoading, error]);

  // Handle refreshing the page
  const handleRefresh = () => {
    window.location.reload();
  };

  // Show error state if there was a problem loading inventory data
  if (error) {
    console.error("Error loading inventory items:", error);
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-kitchen-800">Inventory</h2>
        </div>
        
        <div className="text-center py-10 border border-dashed border-kitchen-200 rounded-lg bg-kitchen-50">
          <h3 className="text-lg font-medium text-red-600">Error loading inventory items</h3>
          <p className="text-kitchen-500 mt-1">{error.message}</p>
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-kitchen-800">
          Inventory {selectedRestaurant?.name ? `for ${selectedRestaurant.name}` : ''}
        </h2>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse bg-kitchen-100 rounded-lg"></div>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <InventoryCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : selectedRestaurant ? (
        <div className="text-center py-10">
          <p className="text-kitchen-500">No inventory items found</p>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-kitchen-500">Please select a restaurant</p>
        </div>
      )}
    </div>
  );
};
