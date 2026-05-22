CREATE TABLE public.knowledge_base_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage knowledge base articles"
  ON public.knowledge_base_articles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view published articles"
  ON public.knowledge_base_articles
  FOR SELECT
  TO authenticated
  USING (is_published = true);