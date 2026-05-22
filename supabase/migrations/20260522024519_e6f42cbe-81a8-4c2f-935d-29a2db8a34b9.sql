
CREATE OR REPLACE VIEW public.v_b2b_companies AS
SELECT c.id, c.name, c.tier::text AS tier, c.seat_count, c.seats_used,
       c.license_status::text AS license_status, c.license_expires_at,
       c.billing_status::text AS billing_status, c.created_at
FROM b2b.companies c;
GRANT SELECT ON public.v_b2b_companies TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_b2b_members AS
SELECT
  p.id AS user_id,
  p.company_id,
  COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), u.email, 'Unnamed user') AS full_name,
  p.first_name, p.last_name, p.avatar_url,
  u.email AS email,
  p.department,
  p.status::text AS status,
  COALESCE(ur.role::text, 'company_student') AS role,
  COALESCE(p.last_login, p.user_created_at) AS last_active_at,
  p.user_created_at AS created_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
LEFT JOIN LATERAL (SELECT role FROM public.user_roles WHERE user_id = p.id LIMIT 1) ur ON true
WHERE p.company_id IS NOT NULL;
GRANT SELECT ON public.v_b2b_members TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_b2b_enrolments AS
SELECT e.id, e.user_id, e.course_id, e.assigned_at, e.due_date,
       e.status::text AS status, p.company_id, c.title AS course_title
FROM b2b.enrolments e
JOIN public.profiles p ON p.id = e.user_id
LEFT JOIN public.courses c ON c.id = e.course_id;
GRANT SELECT ON public.v_b2b_enrolments TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_b2b_audit_feed AS
SELECT a.id, a.company_id, a.actor_user_id,
       COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), 'Someone') AS actor_name,
       a.action, a.target_type, a.target_resource_id,
       a."timestamp" AS occurred_at
FROM b2b.audit_logs a
LEFT JOIN public.profiles p ON p.id = a.actor_user_id;
GRANT SELECT ON public.v_b2b_audit_feed TO anon, authenticated;
