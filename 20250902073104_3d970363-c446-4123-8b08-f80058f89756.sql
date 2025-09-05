-- Фиксираме роля за georgi.m.hubenov@gmail.com - трябва да бъде viewer, не owner
UPDATE user_profile 
SET role = 'user' 
WHERE user_id = '3ebc7a45-f443-4b82-8a89-e19b32584b1a' 
AND role = 'owner';