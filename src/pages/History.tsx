
import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getInventoryItems, InventoryItem } from "../services/inventory";
import { useQuery } from "@tanstack/react-query";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { toast } from "sonner";
import { SearchFilters } from "@/components/history/SearchFilters";
import { InventoryTable } from "@/components/history/InventoryTable";
import { PaginationControls } from "@/components/history/PaginationControls";
import { EmptyState } from "@/components/history/EmptyState";

const History: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchColumn, setSearchColumn] = useState("product");
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { selectedRestaurant } = useRestaurantStore();
  const restaurantId = selectedRestaurant?.id;
  
  const { data: inventoryItems, isLoading, error } = useQuery({
    queryKey: ['inventoryItems', restaurantId],
    queryFn: () => getInventoryItems(restaurantId),
    enabled: !!restaurantId
  });
  
  useEffect(() => {
    if (!inventoryItems) return;
    
    let items = [...inventoryItems];
    
    if (activeTab === "active") {
      items = items.filter(item => item.status === "active");
    } else if (activeTab === "used") {
      items = items.filter(item => item.status === "used");
    } else if (activeTab === "waste") {
      items = items.filter(item => item.status === "waste");
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      if (searchColumn === "product") {
        items = items.filter(item => item.product.toLowerCase().includes(query));
      } else if (searchColumn === "staff") {
        items = items.filter(item => {
          const preparedByName = item.preparedByProfile
            ? `${item.preparedByProfile.first_name || ''} ${item.preparedByProfile.last_name || ''}`.trim().toLowerCase()
            : item.preparedBy.toLowerCase();
          return preparedByName.includes(query);
        });
      } else if (searchColumn === "barcode") {
        items = items.filter(item => item.id.toLowerCase().includes(query));
      }
    }
    
    items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setFilteredItems(items);
    setCurrentPage(1);
  }, [activeTab, searchQuery, searchColumn, inventoryItems]);
  
  const paginate = (items: InventoryItem[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const paginatedItems = paginate(filteredItems);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const exportToCSV = () => {
    try {
      // Format all filtered items for CSV export
      const csvData = filteredItems.map(item => ({
        ID: item.id,
        Product: item.product,
        "Prepared By": item.preparedByProfile?.first_name 
          ? `${item.preparedByProfile.first_name || ''} ${item.preparedByProfile.last_name || ''}`.trim()
          : item.preparedBy,
        "Prepared Date": item.preparedDate,
        "Expiry Date": item.expiryDate,
        Status: item.status,
      }));
      
      // Convert to CSV
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => 
        Object.values(row)
          .map(value => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csv = [headers, ...rows].join('\n');
      
      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `inventory-history-${new Date().toISOString().slice(0, 10)}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV file downloaded successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV file");
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <motion.h1 
                className="text-3xl font-bold tracking-tight text-kitchen-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Label History
              </motion.h1>
              <motion.p 
                className="mt-2 text-kitchen-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                View and search your complete inventory history
              </motion.p>
            </div>
            
            <Button 
              onClick={exportToCSV} 
              variant="outline"
              className="mt-4 sm:mt-0 sm:ml-4"
              disabled={filteredItems.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </header>
          
          <SearchFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchColumn={searchColumn}
            setSearchColumn={setSearchColumn}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((index) => (
                <Card key={index} className="p-6 animate-pulse">
                  <div className="flex justify-between">
                    <div className="space-y-3 w-full">
                      <div className="h-4 bg-kitchen-100 rounded w-1/4"></div>
                      <div className="h-3 bg-kitchen-100 rounded w-1/2"></div>
                      <div className="h-3 bg-kitchen-100 rounded w-1/3"></div>
                    </div>
                    <div className="h-6 w-6 bg-kitchen-100 rounded-full"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <h3 className="text-xl font-medium text-kitchen-800 mb-2">Error loading inventory data</h3>
              <p className="text-kitchen-500">
                {error instanceof Error ? error.message : "Failed to load inventory history"}
              </p>
            </div>
          ) : filteredItems.length > 0 ? (
            <>
              <InventoryTable items={paginatedItems} />
              <PaginationControls 
                currentPage={currentPage} 
                totalPages={totalPages} 
                setCurrentPage={setCurrentPage} 
              />
            </>
          ) : (
            <EmptyState searchQuery={searchQuery} />
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default History;
