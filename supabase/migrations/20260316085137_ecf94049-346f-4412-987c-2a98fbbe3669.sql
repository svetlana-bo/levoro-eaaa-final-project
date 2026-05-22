
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'banner' CHECK (type IN ('banner', 'popup')),
  content_html TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  bg_color TEXT NOT NULL DEFAULT '#1F3A60',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  target_pages TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions"
  ON public.promotions FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can view all promotions"
  ON public.promotions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert promotions"
  ON public.promotions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promotions"
  ON public.promotions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promotions"
  ON public.promotions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
