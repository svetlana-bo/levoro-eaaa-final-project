
CREATE TABLE public.instructor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.instructor_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view instructor categories" ON public.instructor_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage instructor categories" ON public.instructor_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.instructor_expertise (
  instructor_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.instructor_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (instructor_id, category_id)
);
CREATE INDEX idx_instructor_expertise_category ON public.instructor_expertise(category_id);
ALTER TABLE public.instructor_expertise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view instructor expertise" ON public.instructor_expertise FOR SELECT TO public USING (true);
CREATE POLICY "Admins or self insert expertise" ON public.instructor_expertise FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = instructor_id);
CREATE POLICY "Admins or self delete expertise" ON public.instructor_expertise FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = instructor_id);

INSERT INTO public.instructor_categories (name, slug, sort_order) VALUES
  ('Business & Strategy', 'business-strategy', 10),
  ('Career', 'career', 20),
  ('Leadership & Teamwork', 'leadership-teamwork', 30),
  ('Workplace Skills', 'workplace-skills', 40),
  ('Personal Effectiveness', 'personal-effectiveness', 50),
  ('Finance', 'finance', 60),
  ('Technology, Data & AI', 'technology-data-ai', 70),
  ('Design', 'design', 80);

DROP VIEW IF EXISTS public.instructor_public_profiles;
CREATE VIEW public.instructor_public_profiles
WITH (security_invoker = false) AS
SELECT
  p.id, p.first_name, p.last_name, p.avatar_url, p.bio, p.linkedin_url, p.country,
  COALESCE((SELECT array_agg(ie.category_id ORDER BY ic.sort_order)
              FROM public.instructor_expertise ie
              JOIN public.instructor_categories ic ON ic.id = ie.category_id
             WHERE ie.instructor_id = p.id), ARRAY[]::uuid[]) AS category_ids,
  COALESCE((SELECT array_agg(ic.name ORDER BY ic.sort_order)
              FROM public.instructor_expertise ie
              JOIN public.instructor_categories ic ON ic.id = ie.category_id
             WHERE ie.instructor_id = p.id), ARRAY[]::text[]) AS category_names
FROM public.profiles p
WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'instructor'::app_role);

GRANT SELECT ON public.instructor_public_profiles TO anon, authenticated;
