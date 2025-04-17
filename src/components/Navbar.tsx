import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Home, Plus, Search, History as HistoryIcon, LogOut, User, LogIn, LayoutDashboard, Settings as SettingsIcon, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { useQuery } from "@tanstack/react-query";
import { getUserRestaurants } from "@/services/restaurants";
import { supabase } from "@/integrations/supabase/client";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { selectedRestaurant } = useRestaurantStore();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !selectedRestaurant) return;
      
      try {
        const { data, error } = await supabase
          .rpc('is_admin_of_restaurant', { 
            p_restaurant_id: selectedRestaurant.id 
          });
        
        if (error) {
          console.error("Error checking admin status:", error);
          return;
        }
        
        setIsAdmin(!!data);
      } catch (error) {
        console.error("Error in admin check:", error);
      }
    };

    checkAdminStatus();
  }, [user, selectedRestaurant]);

  const routes = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: location.pathname === "/",
    },
    {
      href: "/create",
      label: "Create Label",
      icon: Plus,
      active: location.pathname === "/create",
    },
    {
      href: "/scan",
      label: "Scan Barcode",
      icon: Search,
      active: location.pathname === "/scan",
    },
    {
      href: "/history",
      label: "History",
      icon: HistoryIcon,
      active: location.pathname === "/history",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/dashboard",
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <nav className="container flex items-center justify-between h-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link to="/" className="flex flex-col items-start">
            <span className="hidden font-bold text-xl text-kitchen-900 sm:inline-block">KitchenLabel</span>
            {selectedRestaurant && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Store className="h-3 w-3" />
                {selectedRestaurant.name}
              </span>
            )}
          </Link>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex md:items-center md:justify-between md:flex-1 md:ml-8">
          <div className="flex items-center space-x-1">
            {routes.map((route) => (
              <Link to={route.href} key={route.href}>
                <Button
                  variant={route.active ? "default" : "ghost"}
                  size="sm"
                  className="relative"
                >
                  <route.icon className="h-4 w-4 mr-2" />
                  {route.label}
                  {route.active && (
                    <motion.div
                      className="absolute -bottom-[9px] left-0 right-0 h-0.5 bg-primary"
                      layoutId="navbar-indicator"
                      transition={{ type: "spring", duration: 0.6 }}
                    />
                  )}
                </Button>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && selectedRestaurant && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:max-w-xs">
              <div className="flex flex-col space-y-4 mt-8">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    to={route.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant={route.active ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <route.icon className="mr-2 h-5 w-5" />
                      {route.label}
                    </Button>
                  </Link>
                ))}
                
                <div className="mt-auto pt-4 border-t">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 px-2">
                        <Avatar>
                          <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                          <AvatarFallback>
                            {user.email?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            {user.user_metadata?.name || user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Link to="/settings" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full justify-start">
                          <SettingsIcon className="mr-2 h-5 w-5" />
                          Settings
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button className="w-full justify-start">
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};
