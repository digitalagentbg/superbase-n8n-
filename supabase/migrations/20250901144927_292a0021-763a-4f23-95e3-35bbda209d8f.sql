-- Clean up demo data and prepare for real data
-- Remove demo executions
DELETE FROM public.execution WHERE workflow_name IN ('Import Orders', 'Sync CRM', 'Send Emails', 'Realtime test');

-- Remove demo project
DELETE FROM public.project WHERE name = 'Demo Project';

-- Create a function to add real project data
CREATE OR REPLACE FUNCTION public.create_real_project(
  p_project_name text,
  p_description text DEFAULT '',
  p_client_name text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
  v_project_id uuid;
BEGIN
  -- Get current user's account
  SELECT account_id INTO v_account_id 
  FROM public.user_profile 
  WHERE user_id = auth.uid();
  
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;
  
  -- Create new project
  INSERT INTO public.project (name, account_id, created_at)
  VALUES (p_project_name, v_account_id, now())
  RETURNING id INTO v_project_id;
  
  RETURN v_project_id;
END;
$$;

-- Create a function to add real execution data
CREATE OR REPLACE FUNCTION public.add_real_execution(
  p_project_id uuid,
  p_workflow_name text,
  p_status text,
  p_duration_ms integer DEFAULT NULL,
  p_started_at timestamp with time zone DEFAULT now(),
  p_error_message text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
  v_execution_id bigint;
  v_finished_at timestamp with time zone;
BEGIN
  -- Get current user's account
  SELECT account_id INTO v_account_id 
  FROM public.user_profile 
  WHERE user_id = auth.uid();
  
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;
  
  -- Calculate finished time
  IF p_duration_ms IS NOT NULL THEN
    v_finished_at := p_started_at + (p_duration_ms || ' milliseconds')::interval;
  ELSE
    v_finished_at := p_started_at + interval '1 second';
  END IF;
  
  -- Insert execution
  INSERT INTO public.execution (
    account_id, 
    project_id, 
    workflow_name, 
    status, 
    started_at, 
    finished_at, 
    duration_ms, 
    error,
    payload,
    result
  )
  VALUES (
    v_account_id,
    p_project_id,
    p_workflow_name,
    p_status,
    p_started_at,
    v_finished_at,
    p_duration_ms,
    p_error_message,
    '{}',
    '{}'
  )
  RETURNING id INTO v_execution_id;
  
  RETURN v_execution_id;
END;
$$;