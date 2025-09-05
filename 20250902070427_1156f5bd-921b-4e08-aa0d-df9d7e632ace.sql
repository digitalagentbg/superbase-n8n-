-- Временно отстраняваме строгите RLS ограничения за админи
-- за да могат да виждат всички потребители, независимо от tenant

-- Променяме SELECT политиката да позволи на истински админи да виждат всички профили
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;

CREATE POLICY "Admins can view all profiles, users can view own" 
ON public.profiles 
FOR SELECT 
USING (
  -- Потребители могат да виждат своя профил
  user_id = auth.uid() 
  OR
  -- ИЛИ ако са админи (проверка чрез съществуващ админ профил)
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role IN ('admin', 'owner')
  )
);

-- Също така подобряваме UPDATE политиката
DROP POLICY IF EXISTS "Users can update own profile or admins can update in tenant" ON public.profiles;

CREATE POLICY "Admins can manage profiles and users can update own" 
ON public.profiles 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  user_id = auth.uid() 
  OR
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role IN ('admin', 'owner')
  )
);