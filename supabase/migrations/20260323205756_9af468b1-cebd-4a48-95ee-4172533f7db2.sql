
-- 1. Subcategories table
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subcategories" ON public.subcategories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert subcategories" ON public.subcategories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subcategories" ON public.subcategories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete subcategories" ON public.subcategories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 2. Course subcategories join table
CREATE TABLE public.course_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  UNIQUE(course_id, subcategory_id)
);

ALTER TABLE public.course_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course subcategories" ON public.course_subcategories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert course subcategories" ON public.course_subcategories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete course subcategories" ON public.course_subcategories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Instructors can insert own course subcategories" ON public.course_subcategories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_subcategories.course_id AND courses.instructor_id = auth.uid()) AND has_role(auth.uid(), 'instructor'));
CREATE POLICY "Instructors can delete own course subcategories" ON public.course_subcategories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_subcategories.course_id AND courses.instructor_id = auth.uid()));

-- 3. Course instructors join table (additional instructors beyond the primary)
CREATE TABLE public.course_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

ALTER TABLE public.course_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course instructors" ON public.course_instructors FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert course instructors" ON public.course_instructors FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete course instructors" ON public.course_instructors FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 4. Add scheduled_publish_at to courses
ALTER TABLE public.courses ADD COLUMN scheduled_publish_at TIMESTAMPTZ DEFAULT NULL;

-- 5. Add course_details JSONB to courses
ALTER TABLE public.courses ADD COLUMN course_details JSONB DEFAULT NULL;
