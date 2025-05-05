import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, FileText, Calendar, Clock, User, CheckCircle2, XCircle, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { getInventoryItems, InventoryItem } from "../services/inventory";
import { useQuery } from "@tanstack/react-query";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
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
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex w-full md:w-auto md:flex-1 space-x-2">
              <div className="relative w-full max-w-[150px]">
                <Select 
                  value={searchColumn} 
                  onValueChange={setSearchColumn}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="barcode">Barcode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kitchen-400" size={18} />
                <Input
                  type="search"
                  placeholder={`Search by ${searchColumn}...`}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="used">Used</TabsTrigger>
                <TabsTrigger value="waste">Wasted</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
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
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="rounded-md border"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prepared By</TableHead>
                    <TableHead>Prepared Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginate(filteredItems).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} expiryDate={item.expiryDate} />
                      </TableCell>
                      <TableCell>
                        {item.preparedByProfile?.first_name 
                          ? `${item.preparedByProfile.first_name || ''} ${item.preparedByProfile.last_name || ''}`.trim()
                          : item.preparedBy}
                      </TableCell>
                      <TableCell>{item.preparedDate}</TableCell>
                      <TableCell>{item.expiryDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-center py-4">
                  <Pagination>
                    <PaginationContent>
                      {currentPage === 1 ? (
                        <PaginationItem>
                          <Button 
                            variant="outline" 
                            size="default" 
                            className="gap-1 pl-2.5"
                            disabled={true}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>Previous</span>
                          </Button>
                        </PaginationItem>
                      ) : (
                        <PaginationItem>
                          <PaginationPrevious onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={currentPage === i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )).filter((_, i) => {
                        // Only show 5 pages max, with current page in the middle if possible
                        const min = Math.max(0, currentPage - 3);
                        const max = Math.min(totalPages - 1, currentPage + 1);
                        return i >= min && i <= max;
                      })}
                      
                      {currentPage === totalPages ? (
                        <PaginationItem>
                          <Button 
                            variant="outline" 
                            size="default" 
                            className="gap-1 pr-2.5"
                            disabled={true}
                          >
                            <span>Next</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                      ) : (
                        <PaginationItem>
                          <PaginationNext onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-kitchen-300 mb-4" />
              <h3 className="text-xl font-medium text-kitchen-800 mb-2">No items found</h3>
              <p className="text-kitchen-500">
                {searchQuery ? `No items match your "${searchQuery}" search` : "Your inventory history will appear here"}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

interface StatusBadgeProps {
  status: string;
  expiryDate: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, expiryDate }) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let bgColor = "";
  let textColor = "";
  let statusText = "";
  
  if (status === "used") {
    bgColor = "bg-gray-100";
    textColor = "text-gray-600";
    statusText = "Used";
  } else if (status === "waste") {
    bgColor = "bg-red-100";
    textColor = "text-red-800";
    statusText = "Wasted";
  } else if (daysUntilExpiry < 0) {
    bgColor = "bg-red-100";
    textColor = "text-red-800";
    statusText = "Expired";
  } else {
    bgColor = "bg-green-100";
    textColor = "text-green-800";
    statusText = "Active";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {statusText}
    </span>
  );
};

export default History;
