import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { InventoryCard } from "../components/InventoryCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Barcode, Clock, Plus, Search, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  getActiveInventoryItems, 
  getRecentItems, 
  getExpiringItems,
  InventoryItem 
} from "../services/inventoryService";

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch all active items
  const { 
    data: activeItems = [], 
    isLoading: isLoadingActive 
  } = useQuery({
    queryKey: ['inventoryItems', 'active'],
    queryFn: getActiveInventoryItems
  });
  
  // Fetch recent items
  const { 
    data: recentItems = [], 
    isLoading: isLoadingRecent 
  } = useQuery({
    queryKey: ['inventoryItems', 'recent'],
    queryFn: getRecentItems
  });
  
  // Fetch expiring items
  const { 
    data: expiringItems = [], 
    isLoading: isLoadingExpiring 
  } = useQuery({
    queryKey: ['inventoryItems', 'expiring'],
    queryFn: getExpiringItems
  });
  
  const isLoading = isLoadingActive || isLoadingRecent || isLoadingExpiring;
  
  // Stats calculations
  const activeItemsCount = activeItems.length;
  const usedItemsCount = 0; // This would need a separate query to get an accurate count
  const totalItems = activeItemsCount + usedItemsCount;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <motion.h1 
            className="text-3xl font-bold tracking-tight text-kitchen-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Kitchen Labeling System
          </motion.h1>
          <motion.p 
            className="mt-2 text-kitchen-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Track and manage your kitchen inventory with digital labels
          </motion.p>
        </header>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((index) => (
              <Card key={index} className="p-6 h-32 animate-pulse">
                <div className="h-4 bg-kitchen-100 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-kitchen-100 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-kitchen-400 text-sm font-medium">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{totalItems}</div>
                    <ShoppingBag className="h-8 w-8 text-kitchen-300" />
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-kitchen-200"></div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-kitchen-400 text-sm font-medium">Active Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{activeItemsCount}</div>
                    <Barcode className="h-8 w-8 text-primary/60" />
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-kitchen-400 text-sm font-medium">Items Expiring Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{expiringItems.length}</div>
                    <Clock className="h-8 w-8 text-orange-300" />
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-400"></div>
              </Card>
            </motion.div>
          </motion.div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-kitchen-800">Inventory</h2>
          <div className="flex space-x-2">
            <Link to="/scan">
              <Button variant="outline" size="sm">
                <Search className="mr-1 h-4 w-4" />
                Scan Barcode
              </Button>
            </Link>
            <Link to="/create">
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Create Label
              </Button>
            </Link>
          </div>
        </div>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <Card key={index} className="p-6 h-48 animate-pulse">
                    <div className="h-4 bg-kitchen-100 rounded w-3/4 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-3 bg-kitchen-100 rounded w-full"></div>
                      <div className="h-3 bg-kitchen-100 rounded w-full"></div>
                      <div className="h-3 bg-kitchen-100 rounded w-3/4"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : activeItems.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {activeItems.map((item, index) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <InventoryCard item={item} index={index} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <p className="text-kitchen-500">No active items found</p>
                <Link to="/create" className="mt-4 inline-block">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Label
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((index) => (
                  <Card key={index} className="p-6 h-48 animate-pulse">
                    <div className="h-4 bg-kitchen-100 rounded w-3/4 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-3 bg-kitchen-100 rounded w-full"></div>
                      <div className="h-3 bg-kitchen-100 rounded w-full"></div>
                      <div className="h-3 bg-kitchen-100 rounded w-3/4"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : recentItems.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {recentItems.map((item, index) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <InventoryCard item={item} index={index} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <p className="text-kitchen-500">No recent items found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="expiring" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((index) => (
                  <Card key={index} className="p-6 h-48 animate-pulse">
                    <div className="h-4 bg-kitchen-100 rounded w-3/4 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-3 bg-kitchen-100 rounded w-full"></div>
                      <div className="h-3 bg-kitchen-100 rounded w-full"></div>
                      <div className="h-3 bg-kitchen-100 rounded w-3/4"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : expiringItems.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {expiringItems.map((item, index) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <InventoryCard item={item} index={index} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <p className="text-kitchen-500">No items expiring soon</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
