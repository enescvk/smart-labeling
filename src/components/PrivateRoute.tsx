
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Spinner } from "./ui/spinner";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // If still checking auth state, show loading spinner
  if (isLoading) {
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

  // If user is authenticated, render the protected content
  return <>{children}</>;
};

export default PrivateRoute;
