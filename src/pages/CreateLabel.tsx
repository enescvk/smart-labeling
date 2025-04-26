
import React from "react";
import { Layout } from "../components/Layout";
import { CreateLabelForm, LabelFormData } from "../components/CreateLabelForm";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { addInventoryItem } from "../services/inventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRestaurantStore } from "@/stores/restaurantStore";

const CreateLabel: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  
  // Debug log to verify selected restaurant
  console.log("CreateLabel page - Creating label for restaurant:", selectedRestaurant?.name, selectedRestaurant?.id);
  
  const addLabelMutation = useMutation({
    mutationFn: async (data: LabelFormData & { barcodeId: string }) => {
      try {
        console.log("Starting mutation to add label to inventory:", data);
        console.log("Using restaurant ID:", selectedRestaurant?.id);
        const result = await addInventoryItem({
          id: data.barcodeId,
          product: data.product,
          preparedBy: data.preparedBy,
          preparedDate: data.preparedDate,
          expiryDate: data.expiryDate,
          containerType: data.containerType,
          status: "active"
        }, selectedRestaurant?.id);
        console.log("Successfully added to inventory, returning result:", result);
        return result;
      } catch (error) {
        console.error("Error in mutation function:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Invalidating inventory queries after successful mutation");
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
    },
    onError: (error) => {
      console.error("Error in onError handler:", error);
      toast.error("Failed to add label", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  });
  
  const handleSubmit = (data: LabelFormData & { barcodeId: string }) => {
    console.log("handleSubmit called with data:", data);
    
    if (!selectedRestaurant) {
      toast.error("No restaurant selected", {
        description: "Please select a restaurant before creating a label."
      });
      return;
    }
    
    addLabelMutation.mutate(data, {
      onSuccess: () => {
        console.log("Label successfully added to inventory");
        toast.success("Label added to inventory", {
          description: `${data.product} has been added to inventory.`,
          action: {
            label: "View Inventory",
            onClick: () => navigate("/")
          }
        });
      },
      onError: (error) => {
        console.error("Error adding label:", error);
        toast.error("Failed to add label", {
          description: error instanceof Error ? error.message : "An unexpected error occurred"
        });
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-8">
            <motion.h1 
              className="text-3xl font-bold tracking-tight text-kitchen-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Create New Label
            </motion.h1>
            <motion.p 
              className="mt-2 text-kitchen-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Fill out the form to generate a new barcode label
              {selectedRestaurant && (
                <span className="ml-1 font-medium">
                  for {selectedRestaurant.name}
                </span>
              )}
            </motion.p>
          </header>
          
          <CreateLabelForm 
            onSubmit={handleSubmit} 
            isSubmitting={addLabelMutation.isPending}
          />
        </motion.div>
      </div>
    </Layout>
  );
};

export default CreateLabel;
