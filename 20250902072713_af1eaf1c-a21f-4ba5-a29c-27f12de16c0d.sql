-- Включваме отново RLS за profiles таблицата със сигурни политики
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Изтриваме старите политики ако съществуват
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "profile_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profile_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profile_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profile_delete_policy" ON public.profiles;

-- Създаваме нови сигурни RLS политики
CREATE POLICY "Profiles select policy"
ON public.profiles FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_profile up 
    WHERE up.user_id = auth.uid() 
    AND up.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Profiles insert policy"
ON public.profiles FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_profile up 
    WHERE up.user_id = auth.uid() 
    AND up.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Profiles update policy"
ON public.profiles FOR UPDATE
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_profile up 
    WHERE up.user_id = auth.uid() 
    AND up.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_profile up 
    WHERE up.user_id = auth.uid() 
    AND up.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Profiles delete policy"
ON public.profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profile up 
    WHERE up.user_id = auth.uid() 
    AND up.role IN ('admin', 'owner')
  )
);