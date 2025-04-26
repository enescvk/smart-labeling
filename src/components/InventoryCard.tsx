import React from "react";
import { InventoryItem } from "../services/inventory/types";
import { motion } from "framer-motion";
import { Barcode, Calendar, Clock, User, Package } from "lucide-react";

interface InventoryCardProps {
  item: InventoryItem;
  index?: number;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, index = 0 }) => {
  // Calculate days until expiry
  const today = new Date();
  const expiryDate = new Date(item.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Format preparer name
  const preparerName = item.preparedByProfile?.first_name || item.preparedByProfile?.last_name
    ? `${item.preparedByProfile.first_name || ''} ${item.preparedByProfile.last_name || ''}`.trim()
    : item.preparedBy;
  
  // Determine status and styling
  let statusColor = "bg-green-100 text-green-800";
  let statusText = "Active";
  
  if (item.status === "used") {
    statusColor = "bg-gray-100 text-gray-600";
    statusText = "Used";
  } else if (daysUntilExpiry < 0) {
    statusColor = "bg-red-100 text-red-800";
    statusText = "Expired";
  } else if (daysUntilExpiry === 0) {
    statusColor = "bg-red-100 text-red-800";
    statusText = "Expires today";
  } else if (daysUntilExpiry <= 2) {
    statusColor = "bg-orange-100 text-orange-800";
    statusText = `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
  }

  return (
    <motion.div 
      className="bg-white shadow-sm border border-kitchen-100 rounded-lg p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-lg text-kitchen-900">{item.product}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
          {statusText}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-kitchen-600">
        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-kitchen-400" />
          <span>Prepared by: {preparerName}</span>
        </div>
        
        <div className="flex items-center">
          <Package className="w-4 h-4 mr-2 text-kitchen-400" />
          <span>Container: {item.containerType}</span>
        </div>
        
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-kitchen-400" />
          <span>Prepared: {item.preparedDate}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2 text-kitchen-400" />
          <span>Expires: {item.expiryDate}</span>
        </div>
      </div>
      
      <div className="flex justify-center mt-4 pt-3 border-t border-kitchen-100">
        <div className="flex items-center text-kitchen-500 text-xs">
          <Barcode className="w-3 h-3 mr-1" />
          <span>{item.id}</span>
        </div>
      </div>
    </motion.div>
  );
};
