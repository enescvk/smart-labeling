
import { Badge } from "@/components/ui/badge";
import type { RestaurantInvitation } from "@/services/restaurants/types";

type PendingInvitationsProps = {
  invitations: RestaurantInvitation[];
  isLoading: boolean;
};

export const PendingInvitations = ({ invitations, isLoading }: PendingInvitationsProps) => {
  if (isLoading) {
    return <div className="text-center py-4">Loading pending invitations...</div>;
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center py-6 border rounded-md">
        <p className="text-muted-foreground">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/30">
          <div>
            <h4 className="font-medium">{invitation.email}</h4>
            <p className="text-xs text-muted-foreground">
              Invited as <span className="capitalize">{invitation.role}</span> •{' '}
              Expires {new Date(invitation.expires_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="secondary">Pending</Badge>
        </div>
      ))}
    </div>
  );
};
