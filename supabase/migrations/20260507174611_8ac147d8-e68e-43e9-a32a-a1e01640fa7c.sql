CREATE TYPE public.instructor_type AS ENUM ('individual', 'company');

ALTER TABLE public.profiles
  ADD COLUMN instructor_type public.instructor_type NULL,
  ADD COLUMN company_name text NULL,
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_name_or_company_chk
  CHECK (
    (instructor_type = 'company' AND company_name IS NOT NULL AND length(btrim(company_name)) > 0)
    OR (first_name IS NOT NULL AND last_name IS NOT NULL)
  );

DROP VIEW IF EXISTS public.instructor_public_profiles;
CREATE VIEW public.instructor_public_profiles AS
SELECT id, first_name, last_name, company_name, instructor_type,
       avatar_url, bio, linkedin_url, country
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'instructor'::public.app_role
);