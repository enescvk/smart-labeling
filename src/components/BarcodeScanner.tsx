
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Barcode, Camera, Check, Search } from "lucide-react";
import { motion } from "framer-motion";
import { getItemById } from "../services/inventory"; // Fixed import path

interface BarcodeScannerProps {
  onItemFound: (barcode: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onItemFound }) => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) {
      toast.error("Please enter a barcode");
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Query the actual database for the barcode
      const item = await getItemById(barcodeInput);
      
      if (item) {
        toast.success("Barcode found!");
        onItemFound(barcodeInput);
      } else {
        toast.error("Barcode not found in inventory");
      }
    } catch (error) {
      toast.error("Error searching for barcode", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const startScanning = () => {
    setIsScanning(true);
    setScanComplete(false);
    
    // Simulate camera scanning for demo
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      
      // For demo, we'll use a random value but in production this should use a real scanner
      // We'll use a fixed value so we can test with a known barcode
      const demoBarcode = "KL480601518652"; // This should be a barcode that exists in the database
      setBarcodeInput(demoBarcode);
      
      setTimeout(() => {
        toast.success("Barcode scanned successfully!");
        onItemFound(demoBarcode);
      }, 500);
    }, 2000);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-6">
        <div className="text-center mb-2">
          <h2 className="text-xl font-semibold">Scan a Barcode</h2>
          <p className="text-kitchen-500 text-sm mt-1">
            Use the camera scanner or enter the barcode manually
          </p>
        </div>
        
        {/* Camera Scanner UI */}
        <div className="relative aspect-video border-2 border-dashed border-kitchen-200 rounded-lg bg-kitchen-50 overflow-hidden">
          {isScanning ? (
            <motion.div 
              className="absolute inset-0 bg-kitchen-900/10 flex flex-col items-center justify-center text-kitchen-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative">
                <Camera className="h-16 w-16 text-primary/80" />
                <motion.div 
                  className="absolute top-1/2 w-full h-0.5 bg-primary"
                  animate={{
                    y: ["-50%", "100%", "-50%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <p className="mt-4 animate-pulse">Scanning...</p>
            </motion.div>
          ) : scanComplete ? (
            <motion.div 
              className="absolute inset-0 bg-green-500/10 flex flex-col items-center justify-center text-green-600"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-green-100 p-3 rounded-full">
                <Check className="h-12 w-12" />
              </div>
              <p className="mt-4 font-medium">Scan Complete!</p>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-kitchen-400">
              <Barcode className="h-16 w-16 opacity-50" />
              <p className="mt-4">Ready to scan</p>
            </div>
          )}
        </div>
        
        <Button
          onClick={startScanning}
          disabled={isScanning}
          className="w-full"
        >
          <Camera className="mr-2 h-4 w-4" />
          {isScanning ? "Scanning..." : "Start Camera Scan"}
        </Button>
        
        <div className="relative flex items-center">
          <span className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-kitchen-200"></span>
          </span>
          <span className="relative mx-auto bg-white px-4 text-sm text-kitchen-500">
            or enter manually
          </span>
        </div>
        
        <form onSubmit={handleManualSearch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barcodeInput">Barcode</Label>
            <div className="flex">
              <Input
                id="barcodeInput"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Enter barcode"
                className="flex-1"
              />
              <Button type="submit" className="ml-2" disabled={isSearching}>
                {isSearching ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
};
