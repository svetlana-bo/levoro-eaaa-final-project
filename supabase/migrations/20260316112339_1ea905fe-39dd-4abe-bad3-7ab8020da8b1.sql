
-- Partners table for admin-editable partner logos
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active partners" ON public.partners FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can view all partners" ON public.partners FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert partners" ON public.partners FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update partners" ON public.partners FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete partners" ON public.partners FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Recommended courses table (admin picks which courses appear in "Recommended" section)
CREATE TABLE public.recommended_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id)
);

ALTER TABLE public.recommended_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recommended courses" ON public.recommended_courses FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert recommended courses" ON public.recommended_courses FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete recommended courses" ON public.recommended_courses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update recommended courses" ON public.recommended_courses FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Membership plans table for dynamic pricing with campaign support
CREATE TABLE public.membership_plans (
  id text PRIMARY KEY, -- 'monthly', 'quarterly', 'yearly'
  title text NOT NULL,
  price_eur numeric NOT NULL,
  original_price_eur numeric NOT NULL,
  billing_period text NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  months integer NOT NULL DEFAULT 1,
  features text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  badge text,
  discount_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view membership plans" ON public.membership_plans FOR SELECT TO public USING (true);
CREATE POLICY "Admins can update membership plans" ON public.membership_plans FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert membership plans" ON public.membership_plans FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete membership plans" ON public.membership_plans FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Seed default membership plans
INSERT INTO public.membership_plans (id, title, price_eur, original_price_eur, billing_period, months, features, sort_order, is_featured, badge) VALUES
('yearly', 'Levoro Annual', 19.90, 19.90, 'yearly', 12, ARRAY['Unlimited access to all courses', 'Certificates of completion', 'Worksheets, templates & tools', 'New courses added regularly', 'Cancel anytime'], 1, true, 'BEST VALUE'),
('quarterly', 'Levoro Quarterly', 24.90, 24.90, 'quarterly', 3, ARRAY['Unlimited access to all courses', 'Certificates of completion', 'Worksheets, templates & tools', 'New courses added regularly', 'Cancel anytime'], 2, false, NULL),
('monthly', 'Levoro Monthly', 29.00, 29.00, 'monthly', 1, ARRAY['Unlimited access to all courses', 'Certificates of completion', 'Worksheets, templates & tools', 'New courses added regularly', 'Cancel anytime'], 3, false, NULL);
