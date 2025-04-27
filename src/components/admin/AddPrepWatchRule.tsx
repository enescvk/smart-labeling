
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { PrepWatchRule } from "./PrepWatchTab"; // Import the type from PrepWatchTab

const formSchema = z.object({
  food_type: z.string().min(1, "Food type is required"),
  minimum_count: z.number().min(1, "Minimum count must be at least 1"),
  frequency: z.enum(["hourly", "daily", "weekly", "monthly"]),
  notify_email: z.string().email("Invalid email address"),
});

type FormData = z.infer<typeof formSchema>;

interface AddPrepWatchRuleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddPrepWatchRule = ({ open, onOpenChange }: AddPrepWatchRuleProps) => {
  const { selectedRestaurant } = useRestaurantStore();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minimum_count: 1,
      frequency: "daily",
    },
  });

  const { data: foodTypes = [] } = useQuery({
    queryKey: ["food-types", selectedRestaurant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_food_types")
        .select("food_types")
        .eq("restaurant_id", selectedRestaurant?.id)
        .single();

      if (error) throw error;
      return data.food_types;
    },
    enabled: !!selectedRestaurant?.id,
  });

  const addRule = useMutation({
    mutationFn: async (data: FormData) => {
      // Use type assertion to bypass TypeScript type checking for the table name
      const { error } = await supabase
        .from('prep_watch_settings' as any)
        .insert({
          restaurant_id: selectedRestaurant?.id,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prep-watch-rules"] });
      toast.success("Rule added successfully");
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to add rule", {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    addRule.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add PrepWatch Rule</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="food_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a food type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {foodTypes.map((type: string) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minimum_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notify_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Rule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
