import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { createRestaurant, getUserRestaurants } from "@/services/restaurants"; 
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { supabase } from "@/integrations/supabase/client";

interface PrivateRouteProps {
  requiresRestaurant: boolean;
  children: React.ReactNode | ((props: { isAdmin: boolean }) => React.ReactNode);
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  requiresRestaurant,
  children 
}) => {
  const { user, isLoading } = useAuth();
  const [isCheckingRestaurant, setIsCheckingRestaurant] = useState(true);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const { selectedRestaurant, loadFirstRestaurant } = useRestaurantStore();

  useEffect(() => {
    const checkUserRestaurant = async () => {
      try {
        if (user) {
          // Check if the user has any restaurants
          const restaurants = await getUserRestaurants();
          
          // If no restaurants and userMetadata has restaurant_name, create one
          if (restaurants.length === 0 && user.user_metadata?.restaurant_name) {
            try {
              console.log("Creating restaurant from metadata:", user.user_metadata.restaurant_name);
              const newRestaurant = await createRestaurant(user.user_metadata.restaurant_name as string);
              toast.success("Restaurant created successfully", {
                description: `${user.user_metadata.restaurant_name} has been set up for you.`
              });
              setHasRestaurant(true);
            } catch (error: any) {
              console.error("Error creating restaurant:", error);
              toast.error("Failed to create restaurant", {
                description: error.message || "Please try again or contact support."
              });
            }
          } else {
            setHasRestaurant(restaurants.length > 0);
            
            // Auto-select the first restaurant if none is selected
            if (restaurants.length > 0 && !selectedRestaurant) {
              console.log("Auto-selecting first restaurant in PrivateRoute");
              await loadFirstRestaurant();
            }
          }

          // Check admin status if there's a selected restaurant
          if (selectedRestaurant) {
            try {
              const { data, error } = await supabase
                .rpc('is_admin_of_restaurant', { 
                  p_restaurant_id: selectedRestaurant.id 
                });
              
              if (error) {
                console.error("Error checking admin status:", error);
              } else {
                setIsAdmin(!!data);
              }
            } catch (error) {
              console.error("Error in admin check:", error);
            }
          }
        }
        setIsCheckingRestaurant(false);
      } catch (error) {
        console.error("Error checking restaurant:", error);
        setIsCheckingRestaurant(false);
      }
    };

    if (!isLoading && user) {
      checkUserRestaurant();
    } else if (!isLoading && !user) {
      setIsCheckingRestaurant(false);
    }
  }, [user, isLoading, selectedRestaurant, loadFirstRestaurant]);

  if (isLoading || (user && isCheckingRestaurant)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2">
          {isLoading ? "Checking authentication..." : "Setting up your restaurant..."}
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} />;
  }

  if (requiresRestaurant && !hasRestaurant) {
    toast.info("Restaurant Required", {
      description: "You need to create a restaurant first."
    });
    
    return <Navigate to="/settings" />;
  }

  return (
    <>
      {typeof children === "function" 
        ? children({ isAdmin }) 
        : children}
    </>
  );
};

export default PrivateRoute;
