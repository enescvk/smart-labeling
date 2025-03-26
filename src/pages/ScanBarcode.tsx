
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { InventoryCard } from "../components/InventoryCard";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2 } from "lucide-react";
import { mockInventory } from "../utils/mockData";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ScanBarcode: React.FC = () => {
  const [foundItem, setFoundItem] = useState<typeof mockInventory[0] | null>(null);
  
  const handleBarcodeFound = (barcode: string) => {
    const item = mockInventory.find(item => item.id === barcode);
    if (item) {
      setFoundItem(item);
    }
  };
  
  const handleMarkAsUsed = () => {
    if (!foundItem) return;
    
    // Update the item in mockInventory
    const itemIndex = mockInventory.findIndex(item => item.id === foundItem.id);
    if (itemIndex !== -1) {
      mockInventory[itemIndex].status = "used";
      
      toast.success("Item marked as used", {
        description: `${foundItem.product} has been marked as used in inventory.`
      });
      
      // Reset found item
      setFoundItem(null);
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
              
              {foundItem ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <InventoryCard item={foundItem} />
                  
                  {foundItem.status === "active" && (
                    <motion.div 
                      className="mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        onClick={handleMarkAsUsed}
                        className="w-full"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark as Used
                      </Button>
                    </motion.div>
                  )}
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
