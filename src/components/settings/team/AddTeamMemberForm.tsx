
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { sendRestaurantInvitation } from "@/services/restaurants/invitationService";
import { useQueryClient } from "@tanstack/react-query";

interface AddTeamMemberFormProps {
  restaurantId: string;
}

export const AddTeamMemberForm = ({ restaurantId }: AddTeamMemberFormProps) => {
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "staff">("staff");
  const [isInvitationLoading, setIsInvitationLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleAddMember = async () => {
    if (!restaurantId) {
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
        restaurantId, 
        newMemberEmail, 
        newMemberRole
      );

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${newMemberEmail}`,
      });

      setNewMemberEmail("");
      setNewMemberRole("staff");
      
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

  return (
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
  );
};
