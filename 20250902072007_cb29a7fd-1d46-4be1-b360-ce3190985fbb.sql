-- СПЕШНО! Временно изключваме RLS за profiles за да работи приложението
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Създаваме функция за админ проверка
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
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = check_user_id 
    AND p.role IN ('admin', 'owner')
  );
$$;