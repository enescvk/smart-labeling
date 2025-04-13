
// Types for restaurant services
export type Restaurant = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type RestaurantMember = {
  id: string;
  user_id: string;
  restaurant_id: string;
  role: 'admin' | 'staff';
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
  };
};
