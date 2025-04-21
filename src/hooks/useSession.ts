
import { useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useRestaurantStore } from "@/stores/restaurantStore";

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { loadFirstRestaurant } = useRestaurantStore();

  const setupAuthListener = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          setTimeout(() => {
            loadFirstRestaurant();
            toast({
              title: "Signed in successfully",
              description: "Welcome back!",
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setTimeout(() => {
            toast({
              title: "Signed out",
              description: "You have been signed out successfully",
            });
          }, 0);
        } else if (event === 'PASSWORD_RECOVERY') {
          setTimeout(() => {
            toast({
              title: "Password recovery",
              description: "Please enter a new password",
            });
          }, 0);
        }
      }
    );

    return subscription;
  };

  const getInitialSession = async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
      }
      
      console.log("Existing session:", currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        setTimeout(() => {
          loadFirstRestaurant();
        }, 0);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error in getInitialSession:", error);
      setIsLoading(false);
    }
  };

  return {
    session,
    user,
    isLoading,
    setIsLoading,
    setupAuthListener,
    getInitialSession,
  };
};
