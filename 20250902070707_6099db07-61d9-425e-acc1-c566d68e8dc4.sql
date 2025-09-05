-- Връщаме админ правата на digitalagentbg@gmail.com
-- И правим само него админ

-- Първо правим всички останали потребители viewer
UPDATE public.profiles 
SET role = 'viewer' 
WHERE email != 'digitalagentbg@gmail.com';

-- Сега правим digitalagentbg@gmail.com единствения админ
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'digitalagentbg@gmail.com';