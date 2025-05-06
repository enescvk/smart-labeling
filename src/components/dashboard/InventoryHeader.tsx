
import React from "react";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { InventoryCard } from "@/components/InventoryCard";
import { InventoryItem } from "@/services/inventory/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface InventoryHeaderProps {
  items: InventoryItem[];
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({ items }) => {
  const { selectedRestaurant } = useRestaurantStore();
  
  const isLoading = false; // Since items are provided via props, there's no loading state

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-kitchen-800">Inventory</h2>
        <div className="flex space-x-2">
          <Button asChild size="sm" variant="outline" className="gap-1">
            <Link to="/create-label">
              <PlusCircle className="w-4 h-4" />
              <span>New Item</span>
            </Link>
          </Button>
        </div>
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
        <div className="text-center py-10 border border-dashed border-kitchen-200 rounded-lg">
          <h3 className="text-lg font-medium text-kitchen-600">No inventory items found</h3>
          <p className="text-kitchen-500 mt-1">Create your first inventory item to get started</p>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/create-label" className="inline-flex items-center">
                <PlusCircle className="w-4 h-4 mr-1" />
                Create Item
              </Link>
            </Button>
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
