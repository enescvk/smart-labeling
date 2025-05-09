
-- Create security definer function to safely get user's restaurant IDs
CREATE OR REPLACE FUNCTION public.get_user_restaurant_ids(user_id UUID DEFAULT auth.uid())
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  rest_id UUID;
BEGIN
  FOR rest_id IN 
    SELECT restaurant_id FROM public.restaurant_members 
    WHERE restaurant_members.user_id = $1
  LOOP
    RETURN NEXT rest_id;
  END LOOP;
  RETURN;
END;
$$;

-- Drop any existing policies on restaurant_members to rebuild them correctly
DROP POLICY IF EXISTS "Members can view their restaurant members" ON public.restaurant_members;
DROP POLICY IF EXISTS "Members can view own record" ON public.restaurant_members;
DROP POLICY IF EXISTS "Admins can insert members" ON public.restaurant_members;
DROP POLICY IF EXISTS "Admins can update members" ON public.restaurant_members;
DROP POLICY IF EXISTS "Admins can delete members" ON public.restaurant_members;

-- Make sure RLS is enabled
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies using security definer functions
CREATE POLICY "Members can view own record"
ON public.restaurant_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Members can view their restaurant members"
ON public.restaurant_members
FOR SELECT
USING (restaurant_id IN (SELECT public.get_user_restaurant_ids()));

-- Admins need special policies for management
CREATE POLICY "Admins can insert members"
ON public.restaurant_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_members.restaurant_id = NEW.restaurant_id
    AND restaurant_members.user_id = auth.uid()
    AND restaurant_members.role = 'admin'
  )
);

CREATE POLICY "Admins can update members"
ON public.restaurant_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_members.restaurant_id = restaurant_id
    AND restaurant_members.user_id = auth.uid()
    AND restaurant_members.role = 'admin'
  )
);

CREATE POLICY "Admins can delete members"
ON public.restaurant_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_members.restaurant_id = restaurant_id
    AND restaurant_members.user_id = auth.uid()
    AND restaurant_members.role = 'admin'
  )
);
