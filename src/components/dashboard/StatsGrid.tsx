
import React from "react";
import { motion } from "framer-motion";
import { StatsCard } from "./StatsCard";
import { Clock, ShoppingBag, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsGridProps {
  activeItemsCount: number;
  expiringItemsCount: number;
  expiredItemsCount: number;
  isLoading: boolean;
  onFilterChange: (filter: 'active' | 'expiring' | 'expired') => void;
  currentFilter: 'active' | 'expiring' | 'expired';
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  activeItemsCount,
  expiringItemsCount,
  expiredItemsCount,
  isLoading,
  onFilterChange,
  currentFilter,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((index) => (
          <Card key={index} className="p-6 h-32 animate-pulse">
            <div className="h-4 bg-kitchen-100 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-kitchen-100 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    { 
      title: "Active Items", 
      value: activeItemsCount, 
      icon: ShoppingBag, 
      color: "text-primary/60",
      filter: 'active' as const,
    },
    { 
      title: "Items Expiring Soon", 
      value: expiringItemsCount, 
      icon: Clock, 
      color: "text-orange-300",
      filter: 'expiring' as const,
    },
    { 
      title: "Expired Items", 
      value: expiredItemsCount, 
      icon: AlertTriangle, 
      color: "text-red-300",
      filter: 'expired' as const,
    },
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
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
          onClick={() => onFilterChange(stat.filter)}
          isSelected={currentFilter === stat.filter}
        />
      ))}
    </motion.div>
  );
};
