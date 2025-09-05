-- Enable Row Level Security on tables missing RLS protection
-- (Views inherit RLS from their underlying tables, so we only need to enable RLS on actual tables)

-- Enable RLS on mulchbg table
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