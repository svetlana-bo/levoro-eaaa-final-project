
-- 1. Add 'company_member' to instructor_type enum
ALTER TYPE public.instructor_type ADD VALUE IF NOT EXISTS 'company_member';

-- 2. instructor_companies table
CREATE SEQUENCE IF NOT EXISTS public.instructor_companies_display_id_seq;

CREATE TABLE public.instructor_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id bigint NOT NULL DEFAULT nextval('public.instructor_companies_display_id_seq'),
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  bio text,
  country text,
  linkedin_url text,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.instructor_companies_display_id_seq OWNED BY public.instructor_companies.display_id;

ALTER TABLE public.instructor_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view instructor companies"
  ON public.instructor_companies FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage instructor companies"
  ON public.instructor_companies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_instructor_companies_updated_at
  BEFORE UPDATE ON public.instructor_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_threads_updated_at();

-- 3. instructor_company_members table
CREATE TABLE public.instructor_company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.instructor_companies(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'instructor'
    CHECK (member_role IN ('main_instructor', 'instructor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

CREATE INDEX idx_instructor_company_members_company ON public.instructor_company_members(company_id);
CREATE INDEX idx_instructor_company_members_user ON public.instructor_company_members(user_id);

ALTER TABLE public.instructor_company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view company members"
  ON public.instructor_company_members FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage company members"
  ON public.instructor_company_members FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. courses ownership columns
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS owner_type text NOT NULL DEFAULT 'user'
    CHECK (owner_type IN ('user', 'company')),
  ADD COLUMN IF NOT EXISTS owner_id uuid;

CREATE INDEX IF NOT EXISTS idx_courses_owner ON public.courses(owner_type, owner_id);
