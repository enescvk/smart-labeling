
import React from "react";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  searchQuery: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery }) => {
  return (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 mx-auto text-kitchen-300 mb-4" />
      <h3 className="text-xl font-medium text-kitchen-800 mb-2">No items found</h3>
      <p className="text-kitchen-500">
        {searchQuery ? `No items match your "${searchQuery}" search` : "Your inventory history will appear here"}
      </p>
    </div>
  );
};
