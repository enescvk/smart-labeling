import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRestaurantStore } from "@/stores/restaurantStore";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    restaurantName?: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { loadFirstRestaurant } = useRestaurantStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          // Using setTimeout to prevent potential deadlocks with Supabase auth
          setTimeout(() => {
            console.log("Loading first restaurant after sign in");
            loadFirstRestaurant().then(() => {
              console.log("First restaurant loaded after sign in");
            });
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

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Existing session:", currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        setTimeout(() => {
          console.log("Loading first restaurant for existing session");
          loadFirstRestaurant().then(() => {
            console.log("First restaurant loaded for existing session");
          });
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadFirstRestaurant]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setTimeout(() => {
          toast({
            title: "Error signing in",
            description: error.message,
            variant: "destructive",
          });
        }, 0);
        throw error;
      }
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    restaurantName?: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...(restaurantName ? { restaurant_name: restaurantName } : {}),
            ...(firstName ? { first_name: firstName } : {}),
            ...(lastName ? { last_name: lastName } : {}),
          }
        }
      });

      if (error) {
        setTimeout(() => {
          toast({
            title: "Error signing up",
            description: error.message,
            variant: "destructive",
          });
        }, 0);
        throw error;
      } else {
        setTimeout(() => {
          toast({
            title: "Sign up successful",
            description: "Please check your email for the confirmation link.",
          });
        }, 0);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        setTimeout(() => {
          toast({
            title: "Error signing out",
            description: error.message,
            variant: "destructive",
          });
        }, 0);
        throw error;
      }
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setTimeout(() => {
          toast({
            title: "Error signing in with Google",
            description: error.message,
            variant: "destructive",
          });
        }, 0);
        throw error;
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (newPassword: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        setTimeout(() => {
          toast({
            title: "Error resetting password",
            description: error.message,
            variant: "destructive",
          });
        }, 0);
        throw error;
      } else {
        setTimeout(() => {
          toast({
            title: "Password updated successfully",
            description: "Your password has been reset.",
          });
        }, 0);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue = React.useMemo(() => ({
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword
  }), [session, user, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
