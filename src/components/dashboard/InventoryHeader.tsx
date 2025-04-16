
import React from "react";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { getActiveInventoryItems } from "@/services/inventory/queries";
import { InventoryCard } from "@/components/InventoryCard";

export const InventoryHeader: React.FC = () => {
  const { selectedRestaurant } = useRestaurantStore();
  
  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['inventoryItems', 'active', selectedRestaurant?.id],
    queryFn: () => getActiveInventoryItems(selectedRestaurant?.id),
    enabled: !!selectedRestaurant?.id
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-kitchen-800">Inventory</h2>
          <Button variant="ghost" size="sm" className="p-1">
            <ScanBarcode className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse bg-kitchen-100 rounded-lg"></div>
          ))}
        </div>
      ) : inventoryItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventoryItems.map((item, index) => (
            <InventoryCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : selectedRestaurant ? (
        <div className="text-center py-10 border border-dashed border-kitchen-200 rounded-lg">
          <h3 className="text-lg font-medium text-kitchen-600">No inventory items found</h3>
          <p className="text-kitchen-500 mt-1">Create your first inventory item to get started</p>
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-kitchen-200 rounded-lg">
          <h3 className="text-lg font-medium text-kitchen-600">Please select a restaurant</h3>
          <p className="text-kitchen-500 mt-1">Select a restaurant to view inventory items</p>
        </div>
      )}
    </div>
  );
};
