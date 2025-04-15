import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { 
  createRestaurant, 
  getUserRestaurants, 
  updateRestaurant 
} from "@/services/restaurants/restaurantService";
import { 
  getRestaurantMembers,
  removeRestaurantMember,
  isRestaurantAdmin 
} from "@/services/restaurants/memberService";
import {
  sendRestaurantInvitation
} from "@/services/restaurants/invitationService";
import { 
  Restaurant,
  RestaurantMember 
} from "@/services/restaurants/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Plus, 
  Edit, 
  Trash,
  User, 
  Users,
  Store,
  Settings as SettingsIcon
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Settings = () => {
  const { user, signOut } = useAuth();
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [editRestaurantName, setEditRestaurantName] = useState("");
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "staff">("staff");
  const [isInvitationLoading, setIsInvitationLoading] = useState(false);
  const queryClient = useQueryClient();

  const { 
    data: restaurants = [], 
    isLoading: isLoadingRestaurants,
    refetch: refetchRestaurants 
  } = useQuery({
    queryKey: ['restaurants'],
    queryFn: getUserRestaurants
  });

  useEffect(() => {
    if (restaurants && restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    refetch: refetchMembers
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

  const createRestaurantMutation = useMutation({
    mutationFn: (name: string) => createRestaurant(name),
    onSuccess: () => {
      toast({
        title: "Restaurant created",
        description: "Your restaurant has been created successfully.",
      });
      setNewRestaurantName("");
      queryClient.invalidateQueries({
        queryKey: ['restaurants']
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating restaurant",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateRestaurantMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string; }) => 
      updateRestaurant(id, name),
    onSuccess: () => {
      toast({
        title: "Restaurant updated",
        description: "Restaurant name has been updated successfully.",
      });
      setEditingRestaurantId(null);
      setEditRestaurantName("");
      queryClient.invalidateQueries({
        queryKey: ['restaurants']
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating restaurant",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ restaurantId, email, role }: { 
      restaurantId: string; 
      email: string; 
      role: "admin" | "staff"; 
    }) => addRestaurantMember(restaurantId, email, role),
    onSuccess: () => {
      toast({
        title: "Member added",
        description: "The team member has been added successfully.",
      });
      setNewMemberEmail("");
      setNewMemberRole("staff");
      queryClient.invalidateQueries({
        queryKey: ['restaurant-members']
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive",
      });
    }
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
    onError: (error) => {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateRestaurant = async () => {
    if (!newRestaurantName.trim()) {
      toast({
        title: "Restaurant name required",
        description: "Please enter a name for your restaurant.",
        variant: "destructive",
      });
      return;
    }
    createRestaurantMutation.mutate(newRestaurantName);
  };

  const handleUpdateRestaurant = async () => {
    if (!editingRestaurantId || !editRestaurantName.trim()) {
      toast({
        title: "Restaurant name required",
        description: "Please enter a name for your restaurant.",
        variant: "destructive",
      });
      return;
    }
    updateRestaurantMutation.mutate({ 
      id: editingRestaurantId, 
      name: editRestaurantName 
    });
  };

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
    } catch (error: any) {
      console.error("Invitation error:", error);
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

  const handleRemoveMember = async (memberId: string) => {
    removeMemberMutation.mutate(memberId);
  };

  const startEditingRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurantId(restaurant.id);
    setEditRestaurantName(restaurant.name);
  };

  const cancelEditingRestaurant = () => {
    setEditingRestaurantId(null);
    setEditRestaurantName("");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Layout>
      <div className="container max-w-5xl py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account, restaurants, and team members</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="restaurants">
              <Store className="h-4 w-4 mr-2" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  View and manage your profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="restaurants">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>My Restaurants</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Restaurant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a New Restaurant</DialogTitle>
                        <DialogDescription>
                          Add a new restaurant to manage inventory for.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Restaurant Name</Label>
                          <Input
                            id="name"
                            placeholder="Enter restaurant name"
                            value={newRestaurantName}
                            onChange={(e) => setNewRestaurantName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleCreateRestaurant}
                          disabled={createRestaurantMutation.isPending}
                        >
                          {createRestaurantMutation.isPending ? "Creating..." : "Create Restaurant"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription>
                  Manage restaurants you have access to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRestaurants ? (
                  <div className="text-center py-6">Loading restaurants...</div>
                ) : restaurants && restaurants.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No restaurants found</p>
                    <p className="text-sm mt-2">Create your first restaurant to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {restaurants && restaurants.map((restaurant) => (
                      <div key={restaurant.id} className="flex justify-between items-center p-4 border rounded-md">
                        {editingRestaurantId === restaurant.id ? (
                          <div className="flex gap-2 flex-grow">
                            <Input
                              value={editRestaurantName}
                              onChange={(e) => setEditRestaurantName(e.target.value)}
                              className="max-w-xs"
                            />
                            <Button size="sm" onClick={handleUpdateRestaurant} disabled={updateRestaurantMutation.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditingRestaurant}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <h3 className="font-medium">{restaurant.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                Created on {new Date(restaurant.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => startEditingRestaurant(restaurant)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage team members for your restaurants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!restaurants || restaurants.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">You need to create a restaurant first</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Select Restaurant</Label>
                      <Select
                        value={selectedRestaurantId || undefined}
                        onValueChange={(value) => setSelectedRestaurantId(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a restaurant" />
                        </SelectTrigger>
                        <SelectContent>
                          {restaurants.map((restaurant) => (
                            <SelectItem key={restaurant.id} value={restaurant.id}>
                              {restaurant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRestaurantId && (
                      <>
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
                                  {members && members.map((member) => (
                                    <div key={member.id} className="flex justify-between items-center p-3 border rounded-md">
                                      <div>
                                        <h4 className="font-medium">{member.user?.email}</h4>
                                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => handleRemoveMember(member.id)}
                                        disabled={removeMemberMutation.isPending}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 border rounded-md">
                            <p className="text-muted-foreground">
                              You need to be an admin to manage team members for this restaurant
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
