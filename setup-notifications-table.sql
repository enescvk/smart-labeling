
-- Create a table to store notifications if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create security definer functions to safely check membership
CREATE OR REPLACE FUNCTION public.check_restaurant_membership(restaurant_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_members.restaurant_id = $1
    AND restaurant_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.check_is_restaurant_admin(restaurant_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.restaurant_members 
    WHERE restaurant_id = $1 
    AND user_id = $2 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies to ensure users can only see notifications for their restaurants
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to view notifications for restaurants they belong to
CREATE POLICY "Users can view their restaurant notifications"
  ON public.notifications
  FOR SELECT
  USING (
    public.check_restaurant_membership(restaurant_id)
  );

-- Policy for users to mark notifications as read
CREATE POLICY "Users can update their restaurant notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    public.check_restaurant_membership(restaurant_id)
  );

-- Policy for restaurant admins to delete notifications
CREATE POLICY "Admins can delete their restaurant notifications"
  ON public.notifications
  FOR DELETE
  USING (
    public.check_is_restaurant_admin(restaurant_id)
  );
