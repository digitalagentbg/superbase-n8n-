-- Add project_id column to mulchbg table for proper filtering
ALTER TABLE public.mulchbg ADD COLUMN project_id uuid REFERENCES public.project(id);

-- Update existing records to assign them to the мулчччч project
UPDATE public.mulchbg 
SET project_id = '582c7bab-b769-406d-ba70-4e6a1dc15844'
WHERE project_id IS NULL;

-- Update RLS policy to filter by user's assigned project for non-admin users
DROP POLICY IF EXISTS "Users can view mulchbg records" ON public.mulchbg;

CREATE POLICY "Users can view mulchbg records" ON public.mulchbg
FOR SELECT TO authenticated
USING (
  -- Admins can see everything
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')))
  OR
  -- Non-admin users can only see records from their assigned project
  (project_id IN (SELECT project_id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Update insert policy to automatically set project_id for new records
DROP POLICY IF EXISTS "Authenticated users can insert mulchbg records" ON public.mulchbg;

CREATE POLICY "Users can insert mulchbg records" ON public.mulchbg
FOR INSERT TO authenticated
WITH CHECK (
  -- Set project_id to user's assigned project, or allow admins to specify any project
  (project_id = (SELECT project_id FROM public.profiles WHERE user_id = auth.uid()))
  OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')))
);