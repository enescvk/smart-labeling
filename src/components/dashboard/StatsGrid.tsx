
import React from "react";
import { motion } from "framer-motion";
import { StatsCard } from "./StatsCard";
import { Barcode, Clock, ShoppingBag, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsGridProps {
  totalItems: number;
  activeItemsCount: number;
  expiringItemsCount: number;
  expiredItemsCount: number;
  isLoading: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  totalItems,
  activeItemsCount,
  expiringItemsCount,
  expiredItemsCount,
  isLoading,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="p-6 h-32 animate-pulse">
            <div className="h-4 bg-kitchen-100 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-kitchen-100 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    { title: "Total Items", value: totalItems, icon: ShoppingBag, color: "text-kitchen-300" },
    { title: "Active Items", value: activeItemsCount, icon: Barcode, color: "text-primary/60" },
    { title: "Items Expiring Soon", value: expiringItemsCount, icon: Clock, color: "text-orange-300" },
    { title: "Expired Items", value: expiredItemsCount, icon: AlertTriangle, color: "text-red-300" },
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat, index) => (
        <StatsCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          index={index}
        />
      ))}
    </motion.div>
  );
};

