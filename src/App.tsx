
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { useEffect } from "react";
import { testSupabaseConnection } from "./lib/supabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
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
                  <PrivateRoute requiresRestaurant={false}>
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
                  <PrivateRoute requiresRestaurant={false}>
                    <History />
                  </PrivateRoute>
                } />
                <Route path="/dashboard" element={
                  <PrivateRoute requiresRestaurant={true}>
                    <Dashboard />
                  </PrivateRoute>
                } />
                <Route path="/settings" element={
                  <PrivateRoute requiresRestaurant={false}>
                    <Settings />
                  </PrivateRoute>
                } />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
