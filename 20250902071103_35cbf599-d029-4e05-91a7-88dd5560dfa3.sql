-- ПОПРАВЯМЕ АДМИН ПРАВАТА В ДВЕТЕ ТАБЛИЦИ
-- Уверяваме се че digitalagentbg@gmail.com е админ във всички нужни места

-- 1. Правим админ в profiles таблицата (вече направено)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'digitalagentbg@gmail.com';

-- 2. Правим админ в user_profile таблицата
UPDATE public.user_profile 
SET role = 'admin' 
WHERE user_id = '18c6b6d7-973d-4169-9026-e268b3503ae0';

-- 3. Ако няма запис в user_profile, го създаваме
INSERT INTO public.user_profile (
    user_id, 
    role, 
    account_id
)
SELECT 
    '18c6b6d7-973d-4169-9026-e268b3503ae0',
    'admin',
    p.tenant_id  -- Използваме tenant_id като account_id
FROM public.profiles p 
WHERE p.user_id = '18c6b6d7-973d-4169-9026-e268b3503ae0'
AND NOT EXISTS (
    SELECT 1 FROM public.user_profile up 
    WHERE up.user_id = '18c6b6d7-973d-4169-9026-e268b3503ae0'
);