
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { toast } from "sonner";
import { getRestaurantFoodTypes, updateRestaurantFoodTypes } from "@/services/settings/restaurantFoodTypes";

export const AdminFoodTypes = () => {
  const { selectedRestaurant } = useRestaurantStore();
  const [foodTypes, setFoodTypes] = useState<string[]>([]);
  const [newFoodType, setNewFoodType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchFoodTypes = async () => {
      if (!selectedRestaurant) return;
      setIsLoading(true);
      try {
        const settings = await getRestaurantFoodTypes(selectedRestaurant.id);
        if (settings) setFoodTypes(settings.food_types || []);
      } catch (error) {
        console.error("Error fetching food types:", error);
        toast.error("Failed to load food types");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFoodTypes();
  }, [selectedRestaurant]);

  const handleAddFoodType = () => {
    if (!newFoodType.trim()) return;
    if (foodTypes.some(type => type.toLowerCase() === newFoodType.trim().toLowerCase())) {
      toast.error("This food type already exists");
      return;
    }
    setFoodTypes([...foodTypes, newFoodType.trim()]);
    setNewFoodType("");
  };

  const handleRemoveFoodType = (index: number) => {
    setFoodTypes(foodTypes.filter((_, i) => i !== index));
  };

  const handleSaveFoodTypes = async () => {
    if (!selectedRestaurant) return;
    setIsSaving(true);
    try {
      await updateRestaurantFoodTypes(selectedRestaurant.id, foodTypes);
      toast.success("Food types saved successfully");
    } catch (error) {
      console.error("Error saving food types:", error);
      toast.error("Failed to save food types");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Food Types</CardTitle>
        <CardDescription>
          Add, edit or remove food types for your labels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="New food type..."
              value={newFoodType}
              onChange={(e) => setNewFoodType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddFoodType();
                }
              }}
            />
            <Button onClick={handleAddFoodType}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="border rounded-md">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : foodTypes.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No food types defined</div>
            ) : (
              <ul className="divide-y">
                {foodTypes.map((type, index) => (
                  <li key={index} className="flex items-center justify-between p-3">
                    <span>{type}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFoodType(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveFoodTypes} disabled={isLoading || isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
