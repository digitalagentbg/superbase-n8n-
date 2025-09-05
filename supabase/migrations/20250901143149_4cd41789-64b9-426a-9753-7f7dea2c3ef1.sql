-- Add project_id column to profiles table for user-folder assignment
ALTER TABLE public.profiles 
ADD COLUMN project_id uuid REFERENCES public.project(id);

-- Create index for better performance
CREATE INDEX idx_profiles_project_id ON public.profiles(project_id);