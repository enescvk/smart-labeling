
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeRestaurantMember } from "@/services/restaurants/memberService";
import { toast } from "@/hooks/use-toast";
import type { RestaurantMember } from "@/services/restaurants/types";

interface CurrentMembersProps {
  members: RestaurantMember[];
  isLoading: boolean;
  isAdmin: boolean;
}

export const CurrentMembers = ({ members, isLoading, isAdmin }: CurrentMembersProps) => {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>First Name</TableHead>
          <TableHead>Last Name</TableHead>
          <TableHead>Email Address</TableHead>
          <TableHead>Role</TableHead>
          {isAdmin && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.user?.first_name || '-'}</TableCell>
            <TableCell>{member.user?.last_name || '-'}</TableCell>
            <TableCell>{member.user?.email}</TableCell>
            <TableCell className="capitalize">{member.role}</TableCell>
            {isAdmin && (
              <TableCell>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => removeMemberMutation.mutate(member.id)}
                  disabled={removeMemberMutation.isPending}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
