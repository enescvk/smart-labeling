import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useRestaurantStore } from "@/stores/restaurantStore";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signUp: (email: string, password: string, restaurantName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  removeUserData: (userId: string) => Promise<void>;
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

    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadFirstRestaurant]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Attempting to sign in with:", email);
      
      localStorage.removeItem('supabase.auth.error');
      
      const sanitizedEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      
      console.log("Sign in successful:", data);
      return data;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, restaurantName?: string) => {
    try {
      setIsLoading(true);
      console.log("Attempting to sign up with:", email);
      
      localStorage.removeItem('supabase.auth.error');
      
      const sanitizedEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: restaurantName ? {
            restaurant_name: restaurantName,
          } : undefined,
        }
      });

      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }
      
      console.log("Sign up successful:", data);
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
        throw error;
      } else {
        toast({
          title: "Password updated successfully",
          description: "Your password has been reset.",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeUserData = async (userId: string) => {
    try {
      setIsLoading(true);
      console.log("Attempting to remove user data for:", userId);
      
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profilesError) {
        console.error("Error removing user profile:", profilesError);
        throw profilesError;
      }
      
      const { error: membersError } = await supabase
        .from('restaurant_members')
        .delete()
        .eq('user_id', userId);
      
      if (membersError) {
        console.error("Error removing user from restaurant members:", membersError);
        throw membersError;
      }
      
      toast({
        title: "User data removed",
        description: "The user's application data has been removed successfully",
      });
    } catch (error) {
      console.error("Error removing user data:", error);
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
    resetPassword,
    removeUserData
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
