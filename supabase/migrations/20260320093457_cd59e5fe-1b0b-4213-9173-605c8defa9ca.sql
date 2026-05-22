
-- Drop the overly permissive public policy on profiles
DROP POLICY IF EXISTS "Anyone can view instructor profiles" ON public.profiles;

-- Create a secure view that only exposes safe columns for instructors
CREATE OR REPLACE VIEW public.instructor_public_profiles AS
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

-- Grant access to the view for anon and authenticated
GRANT SELECT ON public.instructor_public_profiles TO anon, authenticated;
