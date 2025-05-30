
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
  const { selectedRestaurant, loadFirstRestaurant, getDefaultRestaurant } = useRestaurantStore();

  useEffect(() => {
    const checkUserRestaurant = async () => {
      try {
        if (!user) {
          console.log("No user found, setting isCheckingRestaurant to false");
          setIsCheckingRestaurant(false);
          return;
        }

        console.log("Checking user restaurant for user:", user.id);
        
        // Check if the user has any restaurants
        const restaurants = await getUserRestaurants();
        console.log("Found restaurants:", restaurants.length);
        
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
        } else if (restaurants.length > 0) {
          console.log("User has", restaurants.length, "restaurants");
          setHasRestaurant(true);
          
          // Auto-select the default restaurant if available and no restaurant is currently selected
          if (!selectedRestaurant) {
            console.log("No restaurant selected, loading first restaurant");
            await loadFirstRestaurant();
          } else {
            console.log("Restaurant already selected:", selectedRestaurant.name);
          }
        } else {
          console.log("No restaurants found for user and no metadata restaurant name");
          setHasRestaurant(false);
        }

        // Check admin status if there's a selected restaurant
        const currentRestaurant = selectedRestaurant || (restaurants.length > 0 ? restaurants[0] : null);
        if (currentRestaurant) {
          try {
            console.log("Checking admin status for restaurant:", currentRestaurant.id);
            const { data, error } = await supabase
              .rpc('check_is_restaurant_admin', { 
                restaurant_id: currentRestaurant.id 
              });
            
            if (error) {
              console.error("Error checking admin status:", error);
            } else {
              console.log("Admin status:", !!data);
              setIsAdmin(!!data);
            }
          } catch (error) {
            console.error("Error in admin check:", error);
          }
        }

      } catch (error) {
        console.error("Error checking restaurant:", error);
      } finally {
        console.log("Setting isCheckingRestaurant to false");
        setIsCheckingRestaurant(false);
      }
    };

    if (!isLoading) {
      checkUserRestaurant();
    }
  }, [user, isLoading, selectedRestaurant, loadFirstRestaurant, getDefaultRestaurant]);

  console.log("PrivateRoute state:", {
    isLoading,
    isCheckingRestaurant,
    hasRestaurant,
    hasUser: !!user,
    hasSelectedRestaurant: !!selectedRestaurant,
    requiresRestaurant
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2">
          Checking authentication...
        </span>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} />;
  }
  
  if (isCheckingRestaurant) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2">
          Setting up your restaurant...
        </span>
      </div>
    );
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
