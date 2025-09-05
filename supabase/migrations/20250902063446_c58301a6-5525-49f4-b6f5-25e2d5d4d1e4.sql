-- Enable Row Level Security on tables missing RLS protection

-- Enable RLS on mulchbg table (appears to be missing RLS)
ALTER TABLE public.mulchbg ENABLE ROW LEVEL SECURITY;

-- Create appropriate policies for mulchbg
-- Since this table appears to be for chat/message history, restrict to authenticated users
CREATE POLICY "Authenticated users can view mulchbg records" 
ON public.mulchbg 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert mulchbg records" 
ON public.mulchbg 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Enable RLS on mv_exec_daily if it's a table (materialized views need RLS too)
ALTER TABLE public.mv_exec_daily ENABLE ROW LEVEL SECURITY;

-- Create policy for mv_exec_daily - restrict to authenticated users
CREATE POLICY "Authenticated users can view daily execution stats" 
ON public.mv_exec_daily 
FOR SELECT 
TO authenticated
USING (true);

-- Note: Views like v_project_last_activity inherit RLS from their underlying tables
-- so they don't need explicit RLS policies