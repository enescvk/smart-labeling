
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentRestaurantId, createRestaurant, getUserRestaurants } from "@/services/restaurantService";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface PrivateRouteProps {
  requiresRestaurant: boolean;
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  requiresRestaurant,
  children 
}) => {
  const { user, isLoading } = useAuth();
  const [isCheckingRestaurant, setIsCheckingRestaurant] = useState(true);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const location = useLocation();

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
  }, [user, isLoading]);

  // Show loading spinner while checking auth or restaurant status
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

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} />;
  }

  // If requires restaurant but user has none, redirect to create restaurant page
  if (requiresRestaurant && !hasRestaurant) {
    toast.info("Restaurant Required", {
      description: "You need to create a restaurant first."
    });
    
    return <Navigate to="/settings" />;
  }

  // Otherwise render children
  return <>{children}</>;
};

export default PrivateRoute;
