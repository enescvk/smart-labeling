
import React from "react";
import { motion } from "framer-motion";

export const PageHeader: React.FC = () => {
  return (
    <header className="mb-8">
      <motion.h1 
        className="text-3xl font-bold tracking-tight text-kitchen-900"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Kitchen Labeling System
      </motion.h1>
      <motion.p 
        className="mt-2 text-kitchen-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Track and manage your kitchen inventory with digital labels
      </motion.p>
    </header>
  );
};

