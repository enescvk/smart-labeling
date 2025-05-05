
import React from "react";

interface StatusBadgeProps {
  status: string;
  expiryDate: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, expiryDate }) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let bgColor = "";
  let textColor = "";
  let statusText = "";
  
  if (status === "used") {
    bgColor = "bg-gray-100";
    textColor = "text-gray-600";
    statusText = "Used";
  } else if (status === "waste") {
    bgColor = "bg-red-100";
    textColor = "text-red-800";
    statusText = "Wasted";
  } else if (daysUntilExpiry < 0) {
    bgColor = "bg-red-100";
    textColor = "text-red-800";
    statusText = "Expired";
  } else {
    bgColor = "bg-green-100";
    textColor = "text-green-800";
    statusText = "Active";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {statusText}
    </span>
  );
};
