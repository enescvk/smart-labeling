import React from "react";
import { Layout } from "../components/Layout";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  getActiveInventoryItems, 
  getRecentItems, 
  getExpiringItems,
  getExpiredItems,
  getInventoryItems
} from "../services/inventoryService";
import { DashboardView } from "../components/DashboardView";
import { AnalyticsChart } from "../components/dashboard/AnalyticsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, ChartPieIcon, LineChart, LayoutDashboard } from "lucide-react";
import { useRestaurantStore } from "@/stores/restaurantStore";

const Dashboard: React.FC = () => {
  const { selectedRestaurant } = useRestaurantStore();
  const restaurantId = selectedRestaurant?.id;
  
  console.log("Dashboard page - Selected restaurant:", selectedRestaurant?.name, restaurantId);
  
  // Fetch all inventory items for analytics
  const { data: allInventoryItems = [], isLoading: allItemsLoading } = useQuery({
    queryKey: ['inventoryItems', 'all', restaurantId],
    queryFn: () => {
      console.log("Dashboard: Fetching all inventory items for restaurant:", restaurantId);
      return getInventoryItems(restaurantId);
    },
    enabled: !!restaurantId
  });

  // Fetch all data needed for dashboard
  const { data: activeItems = [], isLoading: activeLoading } = useQuery({
    queryKey: ['inventoryItems', 'active', restaurantId],
    queryFn: () => {
      console.log("Dashboard: Fetching active items for restaurant:", restaurantId);
      return getActiveInventoryItems(restaurantId);
    },
    enabled: !!restaurantId
  });

  const { data: recentItems = [], isLoading: recentLoading } = useQuery({
    queryKey: ['inventoryItems', 'recent', restaurantId],
    queryFn: () => {
      console.log("Dashboard: Fetching recent items for restaurant:", restaurantId);
      return getRecentItems(restaurantId);
    },
    enabled: !!restaurantId
  });
  
  const { data: expiringItems = [], isLoading: expiringLoading } = useQuery({
    queryKey: ['inventoryItems', 'expiring', restaurantId],
    queryFn: () => {
      console.log("Dashboard: Fetching expiring items for restaurant:", restaurantId);
      return getExpiringItems(restaurantId);
    },
    enabled: !!restaurantId
  });
  
  const { data: expiredItems = [], isLoading: expiredLoading } = useQuery({
    queryKey: ['inventoryItems', 'expired', restaurantId],
    queryFn: () => {
      console.log("Dashboard: Fetching expired items for restaurant:", restaurantId);
      return getExpiredItems(restaurantId);
    },
    enabled: !!restaurantId
  });

  const isLoading = allItemsLoading;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <motion.header 
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-kitchen-900">
            Dashboard
          </h1>
          <p className="mt-2 text-kitchen-500">
            Analytics and visualizations for your kitchen inventory
          </p>
        </motion.header>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="consumption">
              <LineChart className="h-4 w-4 mr-2" />
              Consumption
            </TabsTrigger>
            <TabsTrigger value="categories">
              <ChartPieIcon className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="h-[500px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
              </Card>
            ) : (
              <AnalyticsChart items={allInventoryItems} />
            )}
          </TabsContent>

          <TabsContent value="consumption" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Consumption Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <DashboardView items={allInventoryItems} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Products by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Category analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>Product Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Product summary coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>Expiration Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Expiration overview coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
