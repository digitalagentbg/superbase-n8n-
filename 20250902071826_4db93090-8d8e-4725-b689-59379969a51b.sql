-- СПЕШНО ПОПРАВЯНЕ НА БЕЗКРАЙНАТА РЕКУРСИЯ В RLS ПОЛИТИКИТЕ
-- Проблемът е че политиката проверява profiles таблицата от самата себе си

-- 1. Премахваме проблемната политика
DROP POLICY IF EXISTS "Admins can view all profiles, users can view own" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles and users can update own" ON public.profiles;

-- 2. Създаваме security definer функция за проверка на админ права
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

-- 3. Създаваме нови политики БЕЗ рекурсия
CREATE POLICY "Users can view own profile or admins can view all" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  public.is_user_admin(auth.uid())
);

CREATE POLICY "Users can update own profile or admins can update any" 
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

-- 4. Политика за изтриване (само админи)
CREATE POLICY "Only admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.is_user_admin(auth.uid()));

-- 5. Политика за вмъкване (потребители могат да създават своя профил)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());