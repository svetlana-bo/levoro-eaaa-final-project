-- 1. Add SEO columns to courses
ALTER TABLE public.courses ADD COLUMN meta_title text;
ALTER TABLE public.courses ADD COLUMN meta_description text;

-- 2. Add SEO columns to categories
ALTER TABLE public.categories ADD COLUMN meta_title text;
ALTER TABLE public.categories ADD COLUMN meta_description text;

-- 3. Create bundles table
CREATE TABLE public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  thumbnail_url text,
  price_eur numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  meta_title text,
  meta_description text,
  page_content text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  display_id bigint GENERATED ALWAYS AS IDENTITY
);

-- 4. Create bundle_courses join table
CREATE TABLE public.bundle_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid REFERENCES public.bundles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, course_id)
);

-- 5. RLS for bundles
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active bundles" ON public.bundles FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage bundles" ON public.bundles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. RLS for bundle_courses
ALTER TABLE public.bundle_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view bundle courses" ON public.bundle_courses FOR SELECT USING (true);
CREATE POLICY "Admins manage bundle courses" ON public.bundle_courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));