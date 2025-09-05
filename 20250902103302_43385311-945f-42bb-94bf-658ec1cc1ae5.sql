-- Fix the current_account_id function to work properly
CREATE OR REPLACE FUNCTION current_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.account_id 
  FROM user_profile up 
  WHERE up.user_id = auth.uid()
  LIMIT 1;
$$;