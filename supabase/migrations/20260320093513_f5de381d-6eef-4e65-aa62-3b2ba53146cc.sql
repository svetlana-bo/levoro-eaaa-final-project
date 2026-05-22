
-- Recreate the view with security_invoker to avoid security definer issue
CREATE OR REPLACE VIEW public.instructor_public_profiles
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.bio,
  p.linkedin_url,
  p.country
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'instructor';

-- We need an RLS policy on profiles that allows reading just these columns via the view
-- Since security_invoker means the querying user's permissions apply,
-- we need a narrow policy for public access to instructor profiles
CREATE POLICY "Public can view basic instructor profile fields"
ON public.profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.id AND user_roles.role = 'instructor'
  )
);
