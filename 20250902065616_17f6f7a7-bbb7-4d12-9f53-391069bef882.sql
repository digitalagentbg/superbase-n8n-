-- Създаваме липсващия профил за новия потребител
-- Първо създаваме tenant за него
INSERT INTO public.tenants (id, name) 
VALUES (gen_random_uuid(), 'georgi.m.hubenov@gmail.com Account')
ON CONFLICT DO NOTHING;

-- Взимаме tenant_id 
WITH new_tenant AS (
  SELECT id as tenant_id FROM public.tenants 
  WHERE name = 'georgi.m.hubenov@gmail.com Account'
  LIMIT 1
)
-- Създаваме профил за новия потребител
INSERT INTO public.profiles (
  user_id, 
  email, 
  full_name, 
  role, 
  tenant_id
)
SELECT 
  '3ebc7a45-f443-4b82-8a89-e19b32584b1a'::uuid,
  'georgi.m.hubenov@gmail.com',
  'georgi.m.hubenov@gmail.com',
  'admin',
  nt.tenant_id
FROM new_tenant nt
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = '3ebc7a45-f443-4b82-8a89-e19b32584b1a'
);

-- Създаваме trigger функция за автоматично създаване на профили при нови потребители
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _tenant_id uuid;
  _email text;
  _full_name text;
BEGIN
  -- Взимаме имейла от новия потребител
  _email := NEW.email;
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', _email);

  -- Създаваме нов tenant за потребителя
  INSERT INTO public.tenants (name) 
  VALUES (_email || ' Account')
  RETURNING id INTO _tenant_id;

  -- Създаваме профил за новия потребител
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    role, 
    tenant_id
  ) VALUES (
    NEW.id,
    _email,
    _full_name,
    'admin', -- Нови потребители са admin по подразбиране
    _tenant_id
  );

  RETURN NEW;
END;
$$;

-- Създаваме trigger за автоматично създаване на профили
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();