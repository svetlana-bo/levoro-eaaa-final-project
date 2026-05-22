
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text DEFAULT '',
  content_blocks jsonb DEFAULT '[]'::jsonb,
  thumbnail_url text,
  category text DEFAULT '',
  author_name text DEFAULT '',
  meta_title text,
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE POLICY "Admins can view all blog posts" ON public.blog_posts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert blog posts" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog posts" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog posts" ON public.blog_posts
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
