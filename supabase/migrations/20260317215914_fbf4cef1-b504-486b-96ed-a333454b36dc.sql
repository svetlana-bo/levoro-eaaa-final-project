-- Categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Course-categories junction table
CREATE TABLE public.course_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE(course_id, category_id)
);

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course categories" ON public.course_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert course categories" ON public.course_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete course categories" ON public.course_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Course reviews table
CREATE TABLE public.course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL DEFAULT '',
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews" ON public.course_reviews FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "Admins can view all reviews" ON public.course_reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own reviews" ON public.course_reviews FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own reviews" ON public.course_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own reviews" ON public.course_reviews FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins can update reviews" ON public.course_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete reviews" ON public.course_reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed default categories
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Leadership & Management', 'leadership-management', 'Crown', 1),
  ('Communication Skills', 'communication-skills', 'MessageCircle', 2),
  ('Sales & Marketing', 'sales-marketing', 'TrendingUp', 3),
  ('Project Management', 'project-management', 'FolderKanban', 4),
  ('Personal Development', 'personal-development', 'Sparkles', 5),
  ('Data & Analytics', 'data-analytics', 'BarChart3', 6),
  ('Finance & Accounting', 'finance-accounting', 'Calculator', 7),
  ('Technology & IT', 'technology-it', 'Monitor', 8),
  ('Human Resources', 'human-resources', 'Users', 9),
  ('Entrepreneurship', 'entrepreneurship', 'Rocket', 10);