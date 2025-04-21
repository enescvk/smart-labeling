
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export const useUserData = (setIsLoading: (loading: boolean) => void) => {
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

  return { removeUserData };
};
