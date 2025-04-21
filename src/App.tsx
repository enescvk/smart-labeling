import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Index from "./pages/Index";
import CreateLabel from "./pages/CreateLabel";
import ScanBarcode from "./pages/ScanBarcode";
import History from "./pages/History";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import PasswordReset from "./pages/PasswordReset";
import AcceptInvitation from "./pages/AcceptInvitation";
import { useEffect } from "react";
import { testSupabaseConnection } from "./lib/supabase";
import Admin from "./pages/Admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    // Test Supabase connection on app startup
    testSupabaseConnection();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={
                  <PrivateRoute requiresRestaurant={true}>
                    <Index />
                  </PrivateRoute>
                } />
                <Route path="/create" element={
                  <PrivateRoute requiresRestaurant={true}>
                    <CreateLabel />
                  </PrivateRoute>
                } />
                <Route path="/scan" element={
                  <PrivateRoute requiresRestaurant={true}>
                    <ScanBarcode />
                  </PrivateRoute>
                } />
                <Route path="/history" element={
                  <PrivateRoute requiresRestaurant={true}>
                    <History />
                  </PrivateRoute>
                } />
                <Route path="/dashboard" element={
                  <PrivateRoute requiresRestaurant={true}>
                    {({ isAdmin }) => isAdmin ? <Dashboard /> : <Navigate to="/" />}
                  </PrivateRoute>
                } />
                <Route path="/settings" element={<PrivateRoute requiresRestaurant={false}><Settings /></PrivateRoute>} />
                <Route path="/admin" element={<PrivateRoute requiresRestaurant={true}><Admin /></PrivateRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<PasswordReset />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
