
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
    first_name?: string | null;
    last_name?: string | null;
  };
};

export type RestaurantInvitation = {
  id: string;
  restaurant_id: string;
  email: string;
  role: 'admin' | 'staff';
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  invitation_token: string;
  created_by: string;
};
