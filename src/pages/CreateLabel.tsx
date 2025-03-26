
import React from "react";
import { Layout } from "../components/Layout";
import { CreateLabelForm, LabelFormData } from "../components/CreateLabelForm";
import { toast } from "sonner";
import { mockInventory } from "../utils/mockData";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CreateLabel: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSubmit = (data: LabelFormData & { barcodeId: string }) => {
    // In a real app, this would call an API to save to database
    console.log("Label created:", data);
    
    // Add to mock inventory
    mockInventory.unshift({
      id: data.barcodeId,
      product: data.product,
      preparedBy: data.preparedBy,
      preparedDate: data.preparedDate,
      expiryDate: data.expiryDate,
      status: "active",
      createdAt: new Date().toISOString()
    });
    
    // Success toast with action to view inventory
    toast("Label added to inventory", {
      description: `${data.product} has been added to inventory.`,
      action: {
        label: "View Inventory",
        onClick: () => navigate("/")
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
            </motion.p>
          </header>
          
          <CreateLabelForm onSubmit={handleSubmit} />
        </motion.div>
      </div>
    </Layout>
  );
};

export default CreateLabel;
