-- Fix Security Definer Views by recreating them without SECURITY DEFINER property
-- This addresses the security linter errors for views that may have been created with SECURITY DEFINER

-- Drop existing views if they have SECURITY DEFINER properties
DROP VIEW IF EXISTS public.mv_exec_daily CASCADE;
DROP VIEW IF EXISTS public.v_project_last_activity CASCADE;

-- Recreate mv_exec_daily view without SECURITY DEFINER (standard view)
CREATE VIEW public.mv_exec_daily AS
SELECT 
    date(started_at) AS day,
    count(*) AS total_executions,
    count(*) FILTER (WHERE status = 'success'::text) AS success_count,
    count(*) FILTER (WHERE status <> 'success'::text) AS error_count,
    avg(duration_ms) AS avg_duration_ms,
    (sum(
        CASE
            WHEN status = 'success'::text THEN 1
            ELSE 0
        END)::double precision / count(*)::double precision) AS success_rate
FROM execution
WHERE started_at >= (CURRENT_DATE - '90 days'::interval)
GROUP BY date(started_at)
ORDER BY date(started_at);

-- Recreate v_project_last_activity view without SECURITY DEFINER (standard view) 
CREATE VIEW public.v_project_last_activity AS
SELECT 
    p.id AS project_id,
    p.account_id,
    max(e.started_at) AS last_exec_at
FROM project p
LEFT JOIN execution e ON e.project_id = p.id
GROUP BY p.id, p.account_id;

-- Enable RLS on these views if needed (views inherit RLS from underlying tables)
-- The views will respect the RLS policies of the underlying tables (execution, project)
-- This ensures proper access control without SECURITY DEFINER risks