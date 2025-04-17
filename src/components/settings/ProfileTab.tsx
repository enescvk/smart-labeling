
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantStore } from "@/stores/restaurantStore";

export const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const { selectedRestaurant } = useRestaurantStore();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !selectedRestaurant) return;
      
      try {
        // Check if user is admin of the selected restaurant
        const { data, error } = await supabase
          .rpc('is_admin_of_restaurant', { 
            p_restaurant_id: selectedRestaurant.id 
          });
        
        if (error) {
          console.error("Error checking admin status:", error);
          return;
        }
        
        setIsAdmin(!!data);
        console.log("Is admin of selected restaurant:", data);
      } catch (error) {
        console.error("Error in admin check:", error);
      }
    };

    checkAdminStatus();
  }, [user, selectedRestaurant]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          View and manage your profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
        
        {isAdmin && selectedRestaurant && (
          <Button asChild>
            <Link to="/admin">
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
