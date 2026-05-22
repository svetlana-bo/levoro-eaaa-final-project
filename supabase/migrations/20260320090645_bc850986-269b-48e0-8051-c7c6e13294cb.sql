CREATE TABLE public.favorite_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hex_value text NOT NULL,
  name text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE POLICY "Anyone can view favorite colors"
  ON public.favorite_colors FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert favorite colors"
  ON public.favorite_colors FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update favorite colors"
  ON public.favorite_colors FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete favorite colors"
  ON public.favorite_colors FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));