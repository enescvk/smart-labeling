
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export const usePasswordReset = (setIsLoading: (loading: boolean) => void) => {
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

  return { resetPassword };
};
