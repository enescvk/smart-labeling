
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

-- Add RLS policies to ensure users can only see notifications for their restaurants
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to view notifications for restaurants they belong to
CREATE POLICY "Users can view their restaurant notifications"
  ON public.notifications
  FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.restaurant_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy for users to mark notifications as read
CREATE POLICY "Users can update their restaurant notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.restaurant_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy for restaurant admins to delete notifications
CREATE POLICY "Admins can delete their restaurant notifications"
  ON public.notifications
  FOR DELETE
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.restaurant_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
