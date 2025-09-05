-- ИЗЧИСТВАМЕ ВСИЧКИ RLS ПОЛИТИКИ ЗА PROFILES И ГИ СЪЗДАВАМЕ ОТНОВО БЕЗ РЕКУРСИЯ

-- 1. Премахваме ВСИЧКИ съществуващи политики за profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles, users can view own" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles and users can update own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

-- 2. Създаваме security definer функция за проверка на админ права (ако не съществува)
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profile up
    WHERE up.user_id = check_user_id 
    AND up.role IN ('admin', 'owner')
  );
$$;

-- 3. Създаваме чисти политики БЕЗ рекурсия
CREATE POLICY "profile_select_policy" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  public.is_user_admin(auth.uid())
);

CREATE POLICY "profile_update_policy" 
ON public.profiles 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR 
  public.is_user_admin(auth.uid())
)
WITH CHECK (
  user_id = auth.uid() 
  OR 
  public.is_user_admin(auth.uid())
);

CREATE POLICY "profile_delete_policy" 
ON public.profiles 
FOR DELETE 
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "profile_insert_policy" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid() OR public.is_user_admin(auth.uid()));