-- Add project_id column to profiles table for user-folder assignment
ALTER TABLE public.profiles 
ADD COLUMN project_id uuid REFERENCES public.project(id);

-- Create index for better performance
CREATE INDEX idx_profiles_project_id ON public.profiles(project_id);

-- Update RLS policies to include project-based filtering
DROP POLICY IF EXISTS "Users can view executions in their assigned tenant" ON public.executions;

CREATE POLICY "Users can view executions in their assigned project or tenant" 
ON public.executions 
FOR SELECT 
USING (
  tenant_id = get_user_tenant() 
  OR is_current_user_admin()
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    JOIN public.project pr ON p.project_id = pr.id 
    WHERE p.user_id = auth.uid() 
    AND pr.account_id IN (
      SELECT account_id FROM public.execution e2 WHERE e2.id = executions.id
    )
  )
);