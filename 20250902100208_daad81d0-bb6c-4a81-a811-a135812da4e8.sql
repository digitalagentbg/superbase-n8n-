-- Fix security definer functions by recreating them with proper search paths
CREATE OR REPLACE FUNCTION public.get_user_project_details()
RETURNS TABLE(
  project_id uuid,
  project_name text,
  data_table text,
  filter_column text,
  filter_value text,
  filter_type text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id as project_id,
    p.name as project_name,
    p.data_table,
    p.filter_column,
    p.filter_value,
    p.filter_type
  FROM public.project p
  JOIN public.profiles pr ON pr.project_id = p.id
  WHERE pr.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_has_project_access(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() 
    AND (
      project_id = target_project_id OR
      role IN ('admin', 'owner')
    )
  );
$$;