CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'subscriber',
  title text NOT NULL DEFAULT '',
  heading text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  button_text text NOT NULL DEFAULT 'Subscribe',
  button_color text NOT NULL DEFAULT '#C9A84C',
  button_text_color text NOT NULL DEFAULT '#FFFFFF',
  bg_color text NOT NULL DEFAULT '#FFFFFF',
  text_color text NOT NULL DEFAULT '#1A1A2E',
  bg_image_url text,
  image_url text,
  delay_seconds integer NOT NULL DEFAULT 5,
  target_pages text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  promo_content_html text DEFAULT '',
  promo_link_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage popups" ON public.popups
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active popups" ON public.popups
  FOR SELECT TO anon, authenticated
  USING (is_active = true);