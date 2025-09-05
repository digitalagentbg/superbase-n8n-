-- Address Security Definer View linter warnings by ensuring proper security for table-returning functions
-- These functions need SECURITY DEFINER for admin functionality but must have proper access controls

-- The following functions are flagged by the linter as "Security Definer Views" because they:
-- 1. Have SECURITY DEFINER property 
-- 2. Return table data (like views)
-- 
-- These functions are legitimate admin functions that NEED SECURITY DEFINER to work properly,
-- but we need to ensure they have proper security measures in place.

-- Verify and strengthen security for admin functions
-- All these functions already have proper authorization checks and search_path settings
-- but let's add additional safeguards

-- Add a more restrictive check to admin_dashboard_kpi 
CREATE OR REPLACE FUNCTION public.admin_dashboard_kpi(p_account uuid, days_back integer DEFAULT 30)
RETURNS TABLE(total_exec bigint, success_rate numeric, avg_duration_ms numeric, last_activity timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Enhanced security check: must be admin AND authenticated
  if not (auth.role() = 'authenticated' AND is_admin()) then
    raise exception 'Access denied: Admin privileges required';
  end if;

  -- Additional validation: p_account must not be null
  if p_account is null then
    raise exception 'Account parameter is required';
  end if;

  -- Limit days_back to prevent excessive data queries
  if days_back > 365 then
    raise exception 'Days back parameter cannot exceed 365 days';
  end if;

  return query
  with s as (
    select * from public.execution
    where account_id = p_account
      and started_at >= now() - make_interval(days => days_back)
  )
  select
    count(*) as total_exec,
    (count(*) filter (where status='success'))::numeric / nullif(count(*),0) as success_rate,
    avg(duration_ms)::numeric as avg_duration_ms,
    max(started_at) as last_activity
  from s;
end;
$function$;

-- Add enhanced security to admin_list_accounts
CREATE OR REPLACE FUNCTION public.admin_list_accounts()
RETURNS TABLE(id uuid, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Enhanced security check
  if not (auth.role() = 'authenticated' AND is_admin()) then
    raise exception 'Access denied: Admin privileges required';
  end if;

  return query
  select a.id, a.name
  from public.account a
  order by a.name;
end;
$function$;

-- Add enhanced security to admin_list_executions  
CREATE OR REPLACE FUNCTION public.admin_list_executions(p_account uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS SETOF execution
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Enhanced security check
  if not (auth.role() = 'authenticated' AND is_admin()) then
    raise exception 'Access denied: Admin privileges required';
  end if;

  -- Validate parameters to prevent abuse
  if p_account is null then
    raise exception 'Account parameter is required';
  end if;
  
  if p_limit > 1000 then
    raise exception 'Limit cannot exceed 1000 records';
  end if;

  return query
  select *
  from public.execution
  where account_id = p_account
  order by started_at desc
  limit p_limit offset p_offset;
end;
$function$;

-- Add enhanced security to admin_list_projects
CREATE OR REPLACE FUNCTION public.admin_list_projects(p_account uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Enhanced security check
  if not (auth.role() = 'authenticated' AND is_admin()) then
    raise exception 'Access denied: Admin privileges required';
  end if;

  -- Validate parameters
  if p_account is null then
    raise exception 'Account parameter is required';
  end if;

  return query
  select id, name
  from public.project
  where account_id = p_account
  order by name;
end;
$function$;

-- Note: These functions MUST remain SECURITY DEFINER because they need to access
-- data across tenant boundaries for legitimate admin functionality.
-- The security is ensured through:
-- 1. Proper authentication checks (auth.role() = 'authenticated')
-- 2. Admin privilege verification (is_admin())
-- 3. Parameter validation to prevent abuse
-- 4. SET search_path TO 'public' to prevent search path attacks