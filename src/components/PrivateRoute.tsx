
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // If still checking auth state, show nothing (or could add a loading spinner)
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // If user is authenticated, render the protected content
  return <>{children}</>;
};

export default PrivateRoute;
