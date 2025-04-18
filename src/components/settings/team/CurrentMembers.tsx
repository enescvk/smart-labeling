
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeRestaurantMember } from "@/services/restaurants/memberService";
import { toast } from "@/hooks/use-toast";
import type { RestaurantMember } from "@/services/restaurants/types";

interface CurrentMembersProps {
  members: RestaurantMember[];
  isLoading: boolean;
}

export const CurrentMembers = ({ members, isLoading }: CurrentMembersProps) => {
  const queryClient = useQueryClient();

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeRestaurantMember(memberId),
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "The team member has been removed successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ['restaurant-members']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading team members...</div>;
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-6 border rounded-md">
        <p className="text-muted-foreground">No team members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.id} className="flex justify-between items-center p-3 border rounded-md">
          <div>
            <h4 className="font-medium">{member.user?.email}</h4>
            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
          </div>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => removeMemberMutation.mutate(member.id)}
            disabled={removeMemberMutation.isPending}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};
