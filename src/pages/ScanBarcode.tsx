
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { InventoryCard } from "../components/InventoryCard";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getItemById } from "../services/inventory/queries";
import { updateItemStatus } from "../services/inventory/mutations";
import { InventoryItem } from "../services/inventory/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { printBarcode } from "../utils/barcodeGenerator";
import { useRestaurantStore } from "../stores/restaurantStore";

const ScanBarcode: React.FC = () => {
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "used" | "waste" }) => 
      selectedRestaurant ? updateItemStatus(id, status, selectedRestaurant.id) : Promise.reject("No restaurant selected"),
    onSuccess: (updatedItem) => {
      // Invalidate queries to refresh data after successful update
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      
      // Update the UI with the returned item data if available
      if (updatedItem) {
        console.log("Setting updated item with status:", updatedItem.status);
        
        // Important: Preserve the profile information if not returned by the update call
        if (!updatedItem.preparedByProfile && foundItem?.preparedByProfile) {
          updatedItem.preparedByProfile = foundItem.preparedByProfile;
        }
        
        setFoundItem(updatedItem);
      } else if (foundItem) {
        // If no item is returned, refresh from the database
        refreshItem(foundItem.id);
      }
    },
    onError: (error) => {
      console.error("Error in update mutation:", error);
      toast.error("Failed to update item status", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });
  
  const refreshItem = async (itemId: string) => {
    if (!selectedRestaurant) return;
    
    try {
      console.log(`Refreshing item ${itemId} data from database for restaurant ${selectedRestaurant.id}`);
      const updatedItem = await getItemById(itemId, selectedRestaurant.id);
      console.log("Refreshed item status:", updatedItem?.status);
      setFoundItem(updatedItem);
    } catch (error) {
      console.error("Error refreshing item:", error);
      toast.error("Error refreshing item data");
    }
  };
  
  const handleBarcodeFound = async (barcode: string) => {
    setIsLoading(true);
    try {
      if (!selectedRestaurant) {
        toast.error("No restaurant selected");
        setIsLoading(false);
        return;
      }
      
      console.log(`Looking up item with barcode: ${barcode} for restaurant ${selectedRestaurant.id}`);
      const item = await getItemById(barcode, selectedRestaurant.id);
      setFoundItem(item);
      if (!item) {
        toast.error("Item not found", {
          description: "The scanned barcode does not match any item in inventory."
        });
      } else {
        console.log("Found item with status:", item.status);
      }
    } catch (error) {
      toast.error("Error finding item", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkAsUsed = () => {
    if (!foundItem || !selectedRestaurant) return;
    
    console.log("Marking item as used:", foundItem.id, "for restaurant:", selectedRestaurant.id);
    updateStatusMutation.mutate(
      { id: foundItem.id, status: "used" },
      {
        onSuccess: () => {
          toast.success("Item marked as used", {
            description: `${foundItem.product} has been marked as used in inventory.`
          });
        }
      }
    );
  };

  const handleMarkAsWaste = () => {
    if (!foundItem || !selectedRestaurant) return;
    
    console.log("Marking item as waste:", foundItem.id, "for restaurant:", selectedRestaurant.id);
    updateStatusMutation.mutate(
      { id: foundItem.id, status: "waste" },
      {
        onSuccess: () => {
          toast.success("Item marked as waste", {
            description: `${foundItem.product} has been marked as waste in inventory.`
          });
        }
      }
    );
  };

  const handlePrintLabel = async () => {
    if (!foundItem) return;
    
    setIsPrinting(true);
    
    try {
      await printBarcode(foundItem.id, {
        product: foundItem.product,
        preparedBy: foundItem.preparedBy,
        containerType: foundItem.containerType,
        preparedDate: foundItem.preparedDate,
        expiryDate: foundItem.expiryDate
      });
      
      toast.success("Label sent to printer");
    } catch (error) {
      toast.error("Failed to print label", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-8">
            <motion.h1 
              className="text-3xl font-bold tracking-tight text-kitchen-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Scan Barcode
            </motion.h1>
            <motion.p 
              className="mt-2 text-kitchen-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Scan a barcode to view item details or mark items as used
            </motion.p>
          </header>
          
          <div className="grid gap-6 md:grid-cols-2">
            <BarcodeScanner onItemFound={handleBarcodeFound} />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Scanned Item</h3>
              
              {isLoading ? (
                <div className="kitchen-card animate-pulse p-12 text-kitchen-400">
                  <div className="h-4 bg-kitchen-100 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-kitchen-100 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-kitchen-100 rounded w-3/4"></div>
                </div>
              ) : foundItem ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <InventoryCard item={foundItem} />
                  
                  <motion.div 
                    className="mt-4 grid grid-cols-3 gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      onClick={handlePrintLabel}
                      variant="outline"
                      disabled={isPrinting}
                      className="flex items-center justify-center"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      {isPrinting ? "Printing..." : "Print Label"}
                    </Button>
                    
                    {foundItem.status === "active" && (
                      <>
                        <Button
                          onClick={handleMarkAsUsed}
                          className="flex items-center justify-center"
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {updateStatusMutation.isPending ? "Updating..." : "Mark as Used"}
                        </Button>

                        <Button
                          onClick={handleMarkAsWaste}
                          variant="destructive"
                          className="flex items-center justify-center"
                          disabled={updateStatusMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {updateStatusMutation.isPending ? "Updating..." : "Mark as Waste"}
                        </Button>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <div className="kitchen-card flex flex-col items-center justify-center p-12 text-kitchen-400">
                  <Trash2 className="h-16 w-16 opacity-20 mb-4" />
                  <p>No item scanned yet</p>
                  <p className="text-sm mt-1">Scan a barcode to see item details</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ScanBarcode;
