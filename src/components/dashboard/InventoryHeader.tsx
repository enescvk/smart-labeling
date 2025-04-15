
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const InventoryHeader: React.FC = () => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-kitchen-800">Inventory</h2>
      <div className="flex space-x-2">
        <Link to="/scan">
          <Button variant="outline" size="sm">
            <Search className="mr-1 h-4 w-4" />
            Scan Barcode
          </Button>
        </Link>
      </div>
    </div>
  );
};

