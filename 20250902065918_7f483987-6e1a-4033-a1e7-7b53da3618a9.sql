-- Променяме trigger-а да създава потребители като "viewer" вместо "admin"
-- И поправяме ролята на току-що създадения потребител

-- Първо поправяме ролята на новия потребител
UPDATE public.profiles 
SET role = 'viewer' 
WHERE user_id = '3ebc7a45-f443-4b82-8a89-e19b32584b1a';

-- Променяме trigger функцията да създава viewer потребители
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

  -- Създаваме профил за новия потребител като VIEWER
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
    'viewer', -- Нови потребители са viewer по подразбиране
    _tenant_id
  );

  RETURN NEW;
END;
$$;