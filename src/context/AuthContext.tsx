
import React, { createContext, useContext, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useSession } from "@/hooks/useSession";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { usePasswordReset } from "@/hooks/usePasswordReset";
import { useUserData } from "@/hooks/useUserData";

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
  const { 
    session, 
    user, 
    isLoading, 
    setIsLoading, 
    setupAuthListener, 
    getInitialSession 
  } = useSession();
  
  const { signIn, signUp, signOut, signInWithGoogle } = useAuthMethods(setIsLoading);
  const { resetPassword } = usePasswordReset(setIsLoading);
  const { removeUserData } = useUserData(setIsLoading);

  useEffect(() => {
    const subscription = setupAuthListener();
    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
