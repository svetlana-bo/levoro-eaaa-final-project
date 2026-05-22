-- Allow admins to insert courses (for import functionality)
CREATE POLICY "Admins can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));