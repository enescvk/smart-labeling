
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Package, Bell } from "lucide-react";
import { AdminContainerTypes } from "@/components/admin/AdminContainerTypes";
import { AdminFoodTypes } from "@/components/admin/AdminFoodTypes";
import { PrepWatchTab } from "@/components/admin/PrepWatchTab";
import { useAuth } from "@/context/AuthContext";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const Admin = () => {
  const { user } = useAuth();
  const { selectedRestaurant } = useRestaurantStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !selectedRestaurant) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .rpc('is_admin_of_restaurant', { 
            p_restaurant_id: selectedRestaurant.id 
          });
        
        if (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error("Error in admin check:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, selectedRestaurant]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/settings" />;
  }

  return (
    <Layout>
      <div className="container max-w-6xl py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage restaurant settings and configurations
          </p>
        </div>

        <Tabs defaultValue="container-types">
          <TabsList className="mb-8">
            <TabsTrigger value="container-types">
              <Package className="h-4 w-4 mr-2" />
              Container Types
            </TabsTrigger>
            <TabsTrigger value="food-types">
              <Package className="h-4 w-4 mr-2" />
              Food Types
            </TabsTrigger>
            <TabsTrigger value="prep-watch">
              <Bell className="h-4 w-4 mr-2" />
              PrepWatch
            </TabsTrigger>
            <TabsTrigger value="restaurant-settings">
              <Building className="h-4 w-4 mr-2" />
              Restaurant Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="container-types">
            <AdminContainerTypes />
          </TabsContent>

          <TabsContent value="food-types">
            <AdminFoodTypes />
          </TabsContent>

          <TabsContent value="prep-watch">
            <PrepWatchTab />
          </TabsContent>

          <TabsContent value="restaurant-settings">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Restaurant Settings</h3>
              <p className="text-muted-foreground">
                Additional restaurant settings will be available here in a future update.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
