-- НАПРАВЯВАМЕ ВИ АДМИН ВЕДНАГА!
-- Намираме вашия текущ потребителски ID и правим го админ

-- Правим всички профили с digitalagentbg имейл админи
UPDATE public.profiles 
SET role = 'admin' 
WHERE email LIKE '%digitalagentbg%';

-- Също така ако сте логнат с друг имейл, правим и него админ
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = auth.uid();

-- За сигурност правим и текущо логнатия потребител админ
INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    role, 
    tenant_id
) 
SELECT 
    auth.uid(),
    auth.email(),
    auth.email(),
    'admin',
    (SELECT id FROM public.tenants LIMIT 1)
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid());