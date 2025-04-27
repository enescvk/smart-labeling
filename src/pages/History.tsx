import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Barcode, Calendar, Clock, User, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getInventoryItems, InventoryItem } from "../services/inventory";
import { useQuery } from "@tanstack/react-query";
import { useRestaurantStore } from "@/stores/restaurantStore";

const History: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  
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
      items = items.filter(item => 
        item.product.toLowerCase().includes(query) ||
        item.preparedBy.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    }
    
    items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setFilteredItems(items);
  }, [activeTab, searchQuery, inventoryItems]);
  
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
          <header className="mb-8">
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
          </header>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kitchen-400" size={18} />
              <Input
                type="search"
                placeholder="Search by product, staff, or barcode..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredItems.map((item, index) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <HistoryItem item={item} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <Barcode className="h-12 w-12 mx-auto text-kitchen-300 mb-4" />
              <h3 className="text-xl font-medium text-kitchen-800 mb-2">No items found</h3>
              <p className="text-kitchen-500">
                {searchQuery ? "Try a different search term" : "Your inventory history will appear here"}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

interface HistoryItemProps {
  item: InventoryItem;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item }) => {
  const today = new Date();
  const expiryDate = new Date(item.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let statusColor = "";
  let statusText = "";
  
  if (item.status === "used") {
    statusColor = "bg-gray-100 text-gray-600";
    statusText = "Used";
  } else if (item.status === "waste") {
    statusColor = "bg-red-100 text-red-800";
    statusText = "Wasted";
  } else if (daysUntilExpiry < 0) {
    statusColor = "bg-red-100 text-red-800";
    statusText = "Expired";
  } else {
    statusColor = "bg-green-100 text-green-800";
    statusText = "Active";
  }

  const preparerName = item.preparedByProfile?.first_name || item.preparedByProfile?.last_name
    ? `${item.preparedByProfile.first_name || ''} ${item.preparedByProfile.last_name || ''}`.trim()
    : item.preparedBy;
  
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg text-kitchen-900">{item.product}</h3>
              <p className="text-kitchen-500 text-sm mt-1">Barcode: {item.id}</p>
            </div>
            <span className={`kitchen-chip ${statusColor}`}>
              {statusText}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center text-kitchen-600 text-sm">
              <User className="w-4 h-4 mr-2 text-kitchen-400" />
              <span>Prepared by: {preparerName}</span>
            </div>
            
            <div className="flex items-center text-kitchen-600 text-sm">
              <Calendar className="w-4 h-4 mr-2 text-kitchen-400" />
              <span>Prepared: {item.preparedDate}</span>
            </div>
            
            <div className="flex items-center text-kitchen-600 text-sm">
              <Clock className="w-4 h-4 mr-2 text-kitchen-400" />
              <span>Expires: {item.expiryDate}</span>
            </div>
          </div>
        </div>
        
        <div className={`w-full md:w-2 md:h-full ${statusColor.includes("red") ? "bg-red-400" : statusColor.includes("green") ? "bg-green-400" : "bg-gray-300"}`}>
          {/* Status indicator bar */}
        </div>
      </div>
    </Card>
  );
};

export default History;
