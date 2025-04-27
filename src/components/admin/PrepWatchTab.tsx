import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AddPrepWatchRule } from "./AddPrepWatchRule";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { useRestaurantStore } from "@/stores/restaurantStore";

// Define the interface for our PrepWatch rule
export interface PrepWatchRule {
  id: string;
  food_type: string;
  minimum_count: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  check_hour: number;
  check_minute: number;
  notify_email: string;
  restaurant_id?: string;
}

export const PrepWatchTab = () => {
  const [showAddRule, setShowAddRule] = useState(false);
  const { selectedRestaurant } = useRestaurantStore();
  const queryClient = useQueryClient();

  const { data: prepWatchRules = [], isLoading } = useQuery({
    queryKey: ["prep-watch-rules", selectedRestaurant?.id],
    queryFn: async () => {
      // Use the generic query method with type casting to avoid TypeScript errors
      const { data, error } = await supabase
        .from('prep_watch_settings' as any)
        .select("*")
        .eq("restaurant_id", selectedRestaurant?.id)
        .order("food_type");

      if (error) throw error;
      // Cast the response to our defined interface
      return data as unknown as PrepWatchRule[];
    },
    enabled: !!selectedRestaurant?.id,
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      // Use the generic query method with type casting to avoid TypeScript errors
      const { error } = await supabase
        .from('prep_watch_settings' as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prep-watch-rules"] });
      toast.success("Rule deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete rule", {
        description: error.message,
      });
    },
  });

  if (!selectedRestaurant) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">
          Please select a restaurant to manage prep watch rules
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PrepWatch Rules</CardTitle>
        <CardDescription>
          Set minimum preparation requirements and get notified when inventory falls below thresholds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Button onClick={() => setShowAddRule(true)}>Add New Rule</Button>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : prepWatchRules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Food Type</TableHead>
                  <TableHead>Minimum Count</TableHead>
                  <TableHead>Check Frequency</TableHead>
                  <TableHead>Check Time</TableHead>
                  <TableHead>Notification Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prepWatchRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.food_type}</TableCell>
                    <TableCell>{rule.minimum_count}</TableCell>
                    <TableCell className="capitalize">{rule.frequency}</TableCell>
                    <TableCell>
                      {String(rule.check_hour).padStart(2, '0')}:{String(rule.check_minute).padStart(2, '0')}
                    </TableCell>
                    <TableCell>{rule.notify_email}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRule.mutate(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No prep watch rules configured yet
            </p>
          )}

          <AddPrepWatchRule
            open={showAddRule}
            onOpenChange={setShowAddRule}
          />
        </div>
      </CardContent>
    </Card>
  );
};
