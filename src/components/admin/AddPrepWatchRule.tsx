
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
import { PrepWatchRule } from "./PrepWatchTab";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  food_type: z.string().min(1, "Food type is required"),
  minimum_count: z.number().min(1, "Minimum count must be at least 1"),
  frequency: z.enum(["daily", "weekly"]),
  check_hour: z.number().min(1).max(12),
  check_minute: z.number().min(0).max(59),
  check_period: z.enum(["AM", "PM"]),
  check_day: z.number().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday
  notify_email: z.string().email("Invalid email address"),
}).refine(
  (data) => {
    if (data.frequency === "weekly") {
      return data.check_day !== undefined;
    }
    return true;
  },
  {
    message: "Day is required for weekly frequency",
    path: ["check_day"],
  }
);

type FormData = z.infer<typeof formSchema>;

interface AddPrepWatchRuleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export const AddPrepWatchRule = ({ open, onOpenChange }: AddPrepWatchRuleProps) => {
  const { selectedRestaurant } = useRestaurantStore();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minimum_count: 1,
      frequency: "daily",
      check_hour: 9,
      check_minute: 0,
      check_period: "AM",
      notify_email: user?.email || '',
    },
  });

  const watchFrequency = form.watch("frequency");

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
      if (!selectedRestaurant?.id) {
        throw new Error("No restaurant selected");
      }

      // Convert 12-hour format to 24-hour format
      let hour24 = data.check_hour;
      if (data.check_period === "PM" && data.check_hour !== 12) {
        hour24 += 12;
      } else if (data.check_period === "AM" && data.check_hour === 12) {
        hour24 = 0;
      }

      const { error } = await supabase
        .from('prep_watch_settings')
        .insert({
          restaurant_id: selectedRestaurant.id,
          food_type: data.food_type,
          minimum_count: data.minimum_count,
          frequency: data.frequency,
          check_hour: hour24,
          check_minute: data.check_minute,
          check_period: data.check_period,
          check_day: data.check_day,
          notify_email: data.notify_email,
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
      console.error("Error adding rule:", error);
      toast.error("Failed to add rule", {
        description: error instanceof Error ? error.message : "Unknown error",
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
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchFrequency === "weekly" && (
              <FormField
                control={form.control}
                name="check_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="check_hour"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Hour (1-12)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={12}
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
                name="check_minute"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Minute (0-59)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={59}
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
                name="check_period"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>AM/PM</FormLabel>
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
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
