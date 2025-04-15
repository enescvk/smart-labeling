
import { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  getRestaurantMembers, 
  removeRestaurantMember,
  isRestaurantAdmin 
} from "@/services/restaurants/memberService";
import { sendRestaurantInvitation, getPendingInvitations } from "@/services/restaurants/invitationService";
import { PendingInvitations } from "./PendingInvitations";

type TeamMembersTabProps = {
  selectedRestaurantId: string | null;
};

export const TeamMembersTab = ({ selectedRestaurantId }: TeamMembersTabProps) => {
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "staff">("staff");
  const [isInvitationLoading, setIsInvitationLoading] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading: isLoadingMembers,
  } = useQuery({
    queryKey: ['restaurant-members', selectedRestaurantId],
    queryFn: () => selectedRestaurantId ? getRestaurantMembers(selectedRestaurantId) : Promise.resolve([]),
    enabled: !!selectedRestaurantId
  });

  const {
    data: isAdmin = false,
    isLoading: isLoadingAdminStatus
  } = useQuery({
    queryKey: ['restaurant-admin', selectedRestaurantId],
    queryFn: () => selectedRestaurantId ? isRestaurantAdmin(selectedRestaurantId) : Promise.resolve(false),
    enabled: !!selectedRestaurantId
  });

  const {
    data: pendingInvitations = [],
    isLoading: isLoadingPendingInvitations,
  } = useQuery({
    queryKey: ['pending-invitations', selectedRestaurantId],
    queryFn: () => selectedRestaurantId ? getPendingInvitations(selectedRestaurantId) : Promise.resolve([]),
    enabled: !!selectedRestaurantId
  });

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

  const handleAddMember = async () => {
    if (!selectedRestaurantId) {
      toast({
        title: "No restaurant selected",
        description: "Please select a restaurant first.",
        variant: "destructive",
      });
      return;
    }

    if (!newMemberEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter the email address of the member to add.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsInvitationLoading(true);
      await sendRestaurantInvitation(
        selectedRestaurantId, 
        newMemberEmail, 
        newMemberRole
      );

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${newMemberEmail}`,
      });

      setNewMemberEmail("");
      setNewMemberRole("staff");
      
      // Refresh pending invitations
      queryClient.invalidateQueries({
        queryKey: ['pending-invitations']
      });
    } catch (error: any) {
      const errorMsg = error.message || "Failed to send invitation";
      
      if (errorMsg.includes("duplicate key") || errorMsg.includes("unique constraint")) {
        toast({
          title: "Invitation Updated",
          description: `A previous invitation for ${newMemberEmail} has been updated with the new role.`,
        });
        setNewMemberEmail("");
        setNewMemberRole("staff");
      } else {
        toast({
          title: "Error Sending Invitation",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsInvitationLoading(false);
    }
  };

  if (!selectedRestaurantId) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">You need to create a restaurant first</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage team members for your restaurants
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingAdminStatus ? (
          <div className="text-center py-2">Checking permissions...</div>
        ) : isAdmin ? (
          <div className="space-y-6">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-4">Add Team Member</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    placeholder="Enter team member's email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newMemberRole}
                    onValueChange={(value) => setNewMemberRole(value as 'admin' | 'staff')}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAddMember}
                  disabled={isInvitationLoading}
                >
                  {isInvitationLoading ? "Sending..." : "Add Team Member"}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Current Team Members</h3>
              {isLoadingMembers ? (
                <div className="text-center py-4">Loading team members...</div>
              ) : !members || members.length === 0 ? (
                <div className="text-center py-6 border rounded-md">
                  <p className="text-muted-foreground">No team members found</p>
                </div>
              ) : (
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
              )}
            </div>

            <div>
              <h3 className="font-medium mb-4">Pending Team Members</h3>
              <PendingInvitations 
                invitations={pendingInvitations} 
                isLoading={isLoadingPendingInvitations} 
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border rounded-md">
            <p className="text-muted-foreground">
              You need to be an admin to manage team members for this restaurant
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
