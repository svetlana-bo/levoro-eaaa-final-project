CREATE POLICY "Anyone can view instructor roles"
ON public.user_roles
FOR SELECT
TO public
USING (role = 'instructor'::app_role);