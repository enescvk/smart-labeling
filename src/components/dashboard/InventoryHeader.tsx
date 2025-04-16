
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
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
        <h2 className="text-xl font-semibold text-kitchen-800">Inventory</h2>
        <div className="flex space-x-2">
          <Link to="/scan">
            <Button variant="outline" size="sm">
              <Search className="mr-1 h-4 w-4" />
              Scan Barcode
            </Button>
          </Link>
          <Link to="/labels/create">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New Item
            </Button>
          </Link>
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
          <div className="mt-4">
            <Link to="/labels/create">
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Create Item
              </Button>
            </Link>
          </div>
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
