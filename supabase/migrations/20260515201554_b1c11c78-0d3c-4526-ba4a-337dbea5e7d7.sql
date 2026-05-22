
DROP VIEW IF EXISTS public.instructor_public_profiles;
CREATE VIEW public.instructor_public_profiles
WITH (security_invoker = false) AS
SELECT
  p.id, p.first_name, p.last_name, p.company_name, p.instructor_type,
  p.avatar_url, p.bio, p.linkedin_url, p.country,
  COALESCE((SELECT array_agg(ie.category_id ORDER BY ic.sort_order)
              FROM public.instructor_expertise ie
              JOIN public.instructor_categories ic ON ic.id = ie.category_id
             WHERE ie.instructor_id = p.id), ARRAY[]::uuid[]) AS category_ids,
  COALESCE((SELECT array_agg(ic.name ORDER BY ic.sort_order)
              FROM public.instructor_expertise ie
              JOIN public.instructor_categories ic ON ic.id = ie.category_id
             WHERE ie.instructor_id = p.id), ARRAY[]::text[]) AS category_names
FROM public.profiles p
WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'instructor'::app_role);

GRANT SELECT ON public.instructor_public_profiles TO anon, authenticated;
