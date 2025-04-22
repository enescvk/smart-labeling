import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  getRestaurantMembers, 
  isRestaurantAdmin 
} from "@/services/restaurants/memberService";
import { AddTeamMemberForm } from "./team/AddTeamMemberForm";
import { CurrentMembers } from "./team/CurrentMembers";
import { PendingInvitations } from "./PendingInvitations";
import { getPendingInvitations } from "@/services/restaurants/invitationService";

type TeamMembersTabProps = {
  selectedRestaurantId: string | null;
};

export const TeamMembersTab = ({ selectedRestaurantId }: TeamMembersTabProps) => {
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
        ) : (
          <div className="space-y-6">
            {isAdmin && (
              <AddTeamMemberForm restaurantId={selectedRestaurantId} />
            )}

            <div>
              <h3 className="font-medium mb-4">Current Team Members</h3>
              <CurrentMembers 
                members={members} 
                isLoading={isLoadingMembers} 
                isAdmin={isAdmin}
              />
            </div>

            {isAdmin && (
              <div>
                <h3 className="font-medium mb-4">Pending Team Members</h3>
                <PendingInvitations 
                  invitations={pendingInvitations} 
                  isLoading={isLoadingPendingInvitations} 
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
