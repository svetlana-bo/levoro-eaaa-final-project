CREATE TABLE public.custom_hotspot_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  icon_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_hotspot_icons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom hotspot icons"
  ON public.custom_hotspot_icons FOR SELECT
  TO public USING (true);

CREATE POLICY "Admins can insert custom hotspot icons"
  ON public.custom_hotspot_icons FOR INSERT
  TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update custom hotspot icons"
  ON public.custom_hotspot_icons FOR UPDATE
  TO authenticated USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete custom hotspot icons"
  ON public.custom_hotspot_icons FOR DELETE
  TO authenticated USING (has_role(auth.uid(), 'admin'));