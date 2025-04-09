
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Spinner } from "./ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { getUserRestaurants } from "@/services/restaurantService";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface PrivateRouteProps {
  children: React.ReactNode;
  requiresRestaurant?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiresRestaurant = true // By default, require restaurant connection
}) => {
  const { user, isLoading } = useAuth();

  // Fetch user's restaurants
  const { 
    data: restaurants = [], 
    isLoading: isLoadingRestaurants 
  } = useQuery({
    queryKey: ['userRestaurants'],
    queryFn: getUserRestaurants,
    enabled: !!user, // Only run if user is authenticated
  });

  // If still checking auth state, show loading spinner
  if (isLoading || (user && isLoadingRestaurants)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If route requires restaurant and user has no restaurants, show restaurant selection page
  if (requiresRestaurant && restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-bold mb-4">Restaurant Required</h1>
          <p className="mb-6 text-muted-foreground">
            You need to be connected to a restaurant before you can access this feature.
            Please go to settings to create or join a restaurant.
          </p>
          <Button asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // If user is authenticated and has restaurant (or it's not required), render the protected content
  return <>{children}</>;
};

export default PrivateRoute;
