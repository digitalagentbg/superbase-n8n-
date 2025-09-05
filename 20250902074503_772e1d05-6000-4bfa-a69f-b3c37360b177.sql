-- Fix RLS policies for project-based access

-- Allow users to see mulchbg data (since it doesn't have tenant/user filtering)
DROP POLICY IF EXISTS "Authenticated users can view mulchbg records" ON public.mulchbg;
CREATE POLICY "Users can view mulchbg records" 
ON public.mulchbg 
FOR SELECT 
USING (true); -- For now allow all authenticated users

-- Allow users to see executions from their tenant
DROP POLICY IF EXISTS "Users can view executions in their assigned tenant" ON public.executions;
CREATE POLICY "Users can view executions in their assigned tenant" 
ON public.executions 
FOR SELECT 
USING (
  tenant_id IN (
    SELECT p.tenant_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid()
  )
);

-- Create function to get user's assigned project
CREATE OR REPLACE FUNCTION public.get_user_project_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT project_id FROM public.profiles WHERE user_id = auth.uid();
$$;