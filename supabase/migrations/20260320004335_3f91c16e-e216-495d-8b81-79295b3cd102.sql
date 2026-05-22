CREATE POLICY "Admins can delete draft courses"
ON public.courses
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND status = 'draft'::course_status);