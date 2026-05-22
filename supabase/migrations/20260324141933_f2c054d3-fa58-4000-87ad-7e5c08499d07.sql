CREATE TABLE public.site_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read site pages" ON public.site_pages
  FOR SELECT TO anon, authenticated USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site pages" ON public.site_pages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site pages" ON public.site_pages
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed the three pages
INSERT INTO public.site_pages (id, title, content) VALUES
('privacy', 'Privacy Policy', ''),
('terms', 'Terms and Conditions', ''),
('accessibility', 'Accessibility Statement', '');