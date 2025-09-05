-- Create helper functions for tenant-based access control
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role IN ('admin', 'owner') FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update executions RLS policy for tenant-based access
DROP POLICY IF EXISTS "Users can view executions in their tenant" ON public.executions;
CREATE POLICY "Users can view executions in their assigned tenant"
ON public.executions
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant() OR is_current_user_admin()
);

-- Update profiles RLS to allow admins to manage all profiles
DROP POLICY IF EXISTS "Users can update their own tenant profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles and users can update own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_current_user_admin() OR user_id = auth.uid())
WITH CHECK (is_current_user_admin() OR user_id = auth.uid());

-- Allow admins to view all profiles for management
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Admins can view all profiles, users can view own"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_current_user_admin() OR user_id = auth.uid());

-- Update tenants RLS policy
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
CREATE POLICY "Users can view assigned tenant or admins see all"
ON public.tenants
FOR SELECT
TO authenticated
USING (id = get_user_tenant() OR is_current_user_admin());