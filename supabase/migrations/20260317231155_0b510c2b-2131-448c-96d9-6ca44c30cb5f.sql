-- Add instructor profile fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Allow anyone to view instructor profiles (for public instructor pages)
CREATE POLICY "Anyone can view instructor profiles"
ON public.profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.id
    AND user_roles.role = 'instructor'
  )
);