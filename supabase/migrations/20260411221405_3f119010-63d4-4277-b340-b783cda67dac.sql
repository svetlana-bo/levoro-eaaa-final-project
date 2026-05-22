
CREATE TABLE public.site_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site images"
  ON public.site_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site images"
  ON public.site_images FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site images"
  ON public.site_images FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site images"
  ON public.site_images FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
