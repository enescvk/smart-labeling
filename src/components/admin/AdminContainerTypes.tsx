
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { toast } from "sonner";
import { getRestaurantSettings, updateContainerTypes } from "@/services/settings/restaurantSettings";

export const AdminContainerTypes = () => {
  const { selectedRestaurant } = useRestaurantStore();
  const [containerTypes, setContainerTypes] = useState<string[]>([]);
  const [newContainerType, setNewContainerType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch container types for the selected restaurant
  useEffect(() => {
    const fetchContainerTypes = async () => {
      if (!selectedRestaurant) return;

      setIsLoading(true);
      try {
        const settings = await getRestaurantSettings(selectedRestaurant.id);
        if (settings) {
          setContainerTypes(settings.container_types || []);
        }
      } catch (error) {
        console.error("Error fetching container types:", error);
        toast.error("Failed to load container types");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContainerTypes();
  }, [selectedRestaurant]);

  // Add a new container type
  const handleAddContainerType = () => {
    if (!newContainerType.trim()) return;
    
    // Check if container type already exists (case insensitive)
    if (containerTypes.some(type => 
      type.toLowerCase() === newContainerType.trim().toLowerCase()
    )) {
      toast.error("This container type already exists");
      return;
    }
    
    setContainerTypes([...containerTypes, newContainerType.trim()]);
    setNewContainerType("");
  };

  // Remove a container type
  const handleRemoveContainerType = (index: number) => {
    const updatedTypes = [...containerTypes];
    updatedTypes.splice(index, 1);
    setContainerTypes(updatedTypes);
  };

  // Save container types to the database
  const handleSaveContainerTypes = async () => {
    if (!selectedRestaurant) return;
    
    setIsSaving(true);
    try {
      await updateContainerTypes(selectedRestaurant.id, containerTypes);
      toast.success("Container types saved successfully");
    } catch (error) {
      console.error("Error saving container types:", error);
      toast.error("Failed to save container types");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Container Types</CardTitle>
        <CardDescription>
          Add, edit or remove container types for your labels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new container type */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="New container type..."
              value={newContainerType}
              onChange={(e) => setNewContainerType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddContainerType();
                }
              }}
            />
            <Button onClick={handleAddContainerType}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* List of container types */}
          <div className="border rounded-md">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : containerTypes.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No container types defined</div>
            ) : (
              <ul className="divide-y">
                {containerTypes.map((type, index) => (
                  <li key={index} className="flex items-center justify-between p-3">
                    <span>{type}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveContainerType(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveContainerTypes} 
              disabled={isLoading || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
