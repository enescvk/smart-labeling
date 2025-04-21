import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Edit, Plus, Check, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createRestaurant, getUserRestaurants, updateRestaurant } from "@/services/restaurants/restaurantService";
import type { Restaurant } from "@/services/restaurants/types";
import { useRestaurantStore } from "@/stores/restaurantStore";

export const RestaurantsTab = () => {
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [editRestaurantName, setEditRestaurantName] = useState("");
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [defaultRestaurantId, setDefaultRestaurantId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();
  const { selectedRestaurant, setSelectedRestaurant, setDefaultRestaurant, getDefaultRestaurant } = useRestaurantStore();

  useEffect(() => {
    const loadDefaultRestaurant = async () => {
      const id = await getDefaultRestaurant();
      console.log("Loaded default restaurant ID in RestaurantsTab:", id);
      setDefaultRestaurantId(id);
    };
    loadDefaultRestaurant();
  }, [getDefaultRestaurant]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!selectedRestaurant) return;
      
      try {
        const { data, error } = await supabase
          .rpc('is_admin_of_restaurant', { 
            p_restaurant_id: selectedRestaurant.id 
          });
        
        if (error) {
          console.error("Error checking admin status:", error);
          return;
        }
        
        setIsAdmin(!!data);
      } catch (error) {
        console.error("Error in admin check:", error);
      }
    };

    checkAdminStatus();
  }, [selectedRestaurant]);

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

  const handleSetDefaultRestaurant = async (restaurantId: string) => {
    try {
      await setDefaultRestaurant(restaurantId);
      setDefaultRestaurantId(restaurantId);
      toast({
        title: "Default restaurant set",
        description: "This restaurant will be selected by default when you sign in.",
      });
    } catch (error: any) {
      toast({
        title: "Error setting default restaurant",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>My Restaurants</span>
          {isAdmin && (
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
          )}
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
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="flex items-center">
                        <h3 className="font-medium mr-2">{restaurant.name}</h3>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => startEditingRestaurant(restaurant)}
                          className="p-1 h-auto w-auto"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created on {new Date(restaurant.created_at).toLocaleDateString()}
                      </p>
                      {selectedRestaurant?.id === restaurant.id && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="h-4 w-4" /> Selected
                        </span>
                      )}
                      {defaultRestaurantId === restaurant.id && (
                        <span className="text-sm text-amber-500 flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-500" /> Default
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant={defaultRestaurantId === restaurant.id ? "secondary" : "outline"}
                        onClick={() => handleSetDefaultRestaurant(restaurant.id)}
                        disabled={defaultRestaurantId === restaurant.id}
                        className={defaultRestaurantId === restaurant.id ? "bg-amber-100 hover:bg-amber-200" : ""}
                      >
                        {defaultRestaurantId === restaurant.id ? (
                          <>
                            <Star className="h-4 w-4 mr-1 fill-amber-500" />
                            Default
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Set Default
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm"
                        variant={selectedRestaurant?.id === restaurant.id ? "secondary" : "default"}
                        onClick={() => setSelectedRestaurant(restaurant)}
                        disabled={selectedRestaurant?.id === restaurant.id}
                      >
                        {selectedRestaurant?.id === restaurant.id ? "Selected" : "Select"}
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
