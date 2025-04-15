
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createRestaurant, getUserRestaurants, updateRestaurant } from "@/services/restaurants/restaurantService";
import type { Restaurant } from "@/services/restaurants/types";

export const RestaurantsTab = () => {
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [editRestaurantName, setEditRestaurantName] = useState("");
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: restaurants = [],
    isLoading: isLoadingRestaurants,
  } = useQuery({
    queryKey: ['restaurants'],
    queryFn: getUserRestaurants
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
    onError: (error: Error) => {
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
    onError: (error: Error) => {
      toast({
        title: "Error updating restaurant",
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

  const startEditingRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurantId(restaurant.id);
    setEditRestaurantName(restaurant.name);
  };

  const cancelEditingRestaurant = () => {
    setEditingRestaurantId(null);
    setEditRestaurantName("");
  };

  return (
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
  );
};
