
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  index: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, index }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-kitchen-400 text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold">{value}</div>
            <Icon className={`h-8 w-8 ${color}`} />
          </div>
        </CardContent>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${color.replace('text-', 'bg-').replace('/60', '')}`}></div>
      </Card>
    </motion.div>
  );
};

