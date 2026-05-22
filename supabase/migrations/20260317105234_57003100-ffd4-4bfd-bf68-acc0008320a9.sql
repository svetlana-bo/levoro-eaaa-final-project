-- Admin policies for lessons table
CREATE POLICY "Admins can insert lessons"
ON public.lessons
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lessons"
ON public.lessons
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lessons"
ON public.lessons
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for modules table
CREATE POLICY "Admins can insert modules"
ON public.modules
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update modules"
ON public.modules
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete modules"
ON public.modules
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));