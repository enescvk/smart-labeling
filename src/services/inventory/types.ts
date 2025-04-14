
export interface InventoryItem {
  id: string;
  product: string;
  preparedBy: string;
  preparedDate: string;
  expiryDate: string;
  containerType: string;
  status: "active" | "used";
  createdAt: string;
  restaurantId?: string;
}

// Convert from database schema to client format
export const mapDatabaseItem = (item: any): InventoryItem => {
  return {
    id: item.id,
    product: item.product,
    preparedBy: item.prepared_by,
    preparedDate: item.prepared_date,
    expiryDate: item.expiry_date,
    containerType: item.container_type || "Container",
    status: item.status,
    createdAt: item.created_at,
    restaurantId: item.restaurant_id,
  };
};
