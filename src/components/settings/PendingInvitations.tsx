
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";

type PendingInvitationsProps = {
  invitations: any[];
  isLoading: boolean;
};

export const PendingInvitations: React.FC<PendingInvitationsProps> = ({ 
  invitations,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-6 border rounded-md">
        <p className="text-muted-foreground">No pending invitations</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expires</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              {invitation.email}
            </TableCell>
            <TableCell>
              <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>
                {invitation.role}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">Pending</Badge>
            </TableCell>
            <TableCell>
              {new Date(invitation.expires_at).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
