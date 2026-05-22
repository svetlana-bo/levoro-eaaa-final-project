
DROP VIEW IF EXISTS public.v_b2b_members;

CREATE OR REPLACE VIEW public.v_b2b_members AS
SELECT
  p.id AS user_id,
  p.company_id,
  COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), 'Unnamed user') AS full_name,
  p.first_name, p.last_name, p.avatar_url,
  p.department,
  p.status::text AS status,
  COALESCE(ur.role::text, 'company_student') AS role,
  COALESCE(p.last_login, p.user_created_at) AS last_active_at,
  p.user_created_at AS created_at
FROM public.profiles p
LEFT JOIN LATERAL (SELECT role FROM public.user_roles WHERE user_id = p.id LIMIT 1) ur ON true
WHERE p.company_id IS NOT NULL;

GRANT SELECT ON public.v_b2b_members TO anon, authenticated;
