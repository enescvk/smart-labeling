
import React from "react";
import { motion } from "framer-motion";
import { InventoryItem } from "@/services/inventory";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";

interface InventoryTableProps {
  items: InventoryItem[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ items }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-md border"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prepared By</TableHead>
            <TableHead>Prepared Date</TableHead>
            <TableHead>Expiry Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.product}</TableCell>
              <TableCell className="font-mono text-xs">{item.id}</TableCell>
              <TableCell>
                <StatusBadge status={item.status} expiryDate={item.expiryDate} />
              </TableCell>
              <TableCell>
                {item.preparedByProfile?.first_name 
                  ? `${item.preparedByProfile.first_name || ''} ${item.preparedByProfile.last_name || ''}`.trim()
                  : item.preparedBy}
              </TableCell>
              <TableCell>{item.preparedDate}</TableCell>
              <TableCell>{item.expiryDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
};
