-- Fix RLS policies on profiles table to prevent unauthorized access to personal data
-- Current policies allow admins to see ALL profiles across ALL tenants, which is a security risk

-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "Admins can view all profiles, users can view own" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles and users can update own" ON public.profiles;

-- Create more secure policies that respect tenant boundaries

-- Users can only view profiles within their own tenant
CREATE POLICY "Users can view profiles in their tenant" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own profile
  user_id = auth.uid() 
  OR 
  -- OR admins can see profiles within their tenant only
  (is_current_user_admin() AND tenant_id = get_user_tenant())
);

-- Users can only update their own profile, admins can update profiles in their tenant
CREATE POLICY "Users can update own profile or admins can update in tenant" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Users can update their own profile
  user_id = auth.uid() 
  OR 
  -- OR admins can update profiles within their tenant only
  (is_current_user_admin() AND tenant_id = get_user_tenant())
)
WITH CHECK (
  -- Same restrictions for the updated data
  user_id = auth.uid() 
  OR 
  (is_current_user_admin() AND tenant_id = get_user_tenant())
);

-- Restrict DELETE operations to be more secure
CREATE POLICY "Only admins can delete profiles in their tenant" 
ON public.profiles 
FOR DELETE 
USING (
  is_current_user_admin() AND tenant_id = get_user_tenant()
);