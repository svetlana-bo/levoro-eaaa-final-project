
CREATE SCHEMA IF NOT EXISTS b2b;
GRANT USAGE ON SCHEMA b2b TO anon, authenticated, service_role;

-- Enums
CREATE TYPE b2b.company_tier      AS ENUM ('tier_1','tier_2','tier_3');
CREATE TYPE b2b.license_status    AS ENUM ('active','suspended','expired','cancelled');
CREATE TYPE b2b.billing_status    AS ENUM ('current','past_due','cancelled','none');
CREATE TYPE b2b.user_status       AS ENUM ('active','invited','disabled');
CREATE TYPE b2b.lesson_type       AS ENUM ('video','quiz','text','file');
CREATE TYPE b2b.enrolment_status  AS ENUM ('not_started','in_progress','completed','overdue','withdrawn');
CREATE TYPE b2b.grant_scope       AS ENUM ('support');
CREATE TYPE b2b.engagement_type   AS ENUM ('digitisation','course_creation','consultation');
CREATE TYPE b2b.engagement_status AS ENUM ('active','closed');

-- companies
CREATE TABLE b2b.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier b2b.company_tier NOT NULL DEFAULT 'tier_1',
  seat_count integer NOT NULL DEFAULT 0 CHECK (seat_count >= 0),
  seats_used integer NOT NULL DEFAULT 0 CHECK (seats_used >= 0),
  license_status b2b.license_status NOT NULL DEFAULT 'active',
  license_expires_at timestamptz,
  primary_contact_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  billing_status b2b.billing_status NOT NULL DEFAULT 'none',
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE b2b.companies ENABLE ROW LEVEL SECURITY;

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES b2b.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS status b2b.user_status NOT NULL DEFAULT 'active';
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Extend courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS owner_company_id uuid REFERENCES b2b.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_courses_owner_company_id ON public.courses(owner_company_id);

-- enrolments
CREATE TABLE b2b.enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  status b2b.enrolment_status NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
ALTER TABLE b2b.enrolments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_b2b_enrolments_user ON b2b.enrolments(user_id);
CREATE INDEX idx_b2b_enrolments_course ON b2b.enrolments(course_id);
CREATE INDEX idx_b2b_enrolments_status ON b2b.enrolments(status);

-- lesson_progress
CREATE TABLE b2b.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  enrolment_id uuid NOT NULL REFERENCES b2b.enrolments(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  time_spent_seconds integer NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  dropped_off_at timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrolment_id, lesson_id)
);
ALTER TABLE b2b.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_b2b_lp_enrolment ON b2b.lesson_progress(enrolment_id);
CREATE INDEX idx_b2b_lp_user_lesson ON b2b.lesson_progress(user_id, lesson_id);

-- access_grants
CREATE TABLE b2b.access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  granted_to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES b2b.companies(id) ON DELETE CASCADE,
  scope b2b.grant_scope NOT NULL DEFAULT 'support',
  reason text NOT NULL CHECK (char_length(reason) >= 10),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE b2b.access_grants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_b2b_grants_active ON b2b.access_grants(granted_to_user_id, company_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_b2b_grants_expires ON b2b.access_grants(expires_at);

CREATE OR REPLACE FUNCTION b2b.validate_access_grant()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.expires_at <= NEW.granted_at THEN
    RAISE EXCEPTION 'access_grants.expires_at must be after granted_at';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_access_grant
BEFORE INSERT OR UPDATE ON b2b.access_grants
FOR EACH ROW EXECUTE FUNCTION b2b.validate_access_grant();

-- engagements
CREATE TABLE b2b.engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES b2b.companies(id) ON DELETE CASCADE,
  type b2b.engagement_type NOT NULL,
  assigned_levoro_users uuid[] NOT NULL DEFAULT '{}',
  scope_description text NOT NULL DEFAULT '',
  status b2b.engagement_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  contract_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE b2b.engagements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_b2b_eng_company_status ON b2b.engagements(company_id, status);
CREATE INDEX idx_b2b_eng_users_gin ON b2b.engagements USING GIN(assigned_levoro_users);

CREATE OR REPLACE FUNCTION b2b.validate_engagement()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ends_at <= NEW.started_at THEN
    RAISE EXCEPTION 'engagements.ends_at must be after started_at';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_engagement
BEFORE INSERT OR UPDATE ON b2b.engagements
FOR EACH ROW EXECUTE FUNCTION b2b.validate_engagement();

-- audit_logs
CREATE TABLE b2b.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES b2b.companies(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_resource_id uuid,
  target_type text,
  access_grant_id uuid REFERENCES b2b.access_grants(id) ON DELETE SET NULL,
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  ip_address inet
);
ALTER TABLE b2b.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_b2b_audit_company_ts ON b2b.audit_logs(company_id, "timestamp" DESC);

-- Security-definer helpers
CREATE OR REPLACE FUNCTION b2b.is_company_admin(_user uuid, _company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, b2b AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user
      AND ur.role = 'company_admin'::public.app_role
      AND p.company_id = _company
  );
$$;

CREATE OR REPLACE FUNCTION b2b.is_company_member(_user uuid, _company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, b2b AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user AND company_id = _company
  );
$$;

CREATE OR REPLACE FUNCTION b2b.user_company(_user uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, b2b AS $$
  SELECT company_id FROM public.profiles WHERE id = _user;
$$;

CREATE OR REPLACE FUNCTION b2b.has_active_support_grant(_user uuid, _company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, b2b AS $$
  SELECT EXISTS (
    SELECT 1 FROM b2b.access_grants
    WHERE granted_to_user_id = _user
      AND company_id = _company
      AND scope = 'support'
      AND revoked_at IS NULL
      AND expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION b2b.has_active_engagement(_user uuid, _company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, b2b AS $$
  SELECT EXISTS (
    SELECT 1 FROM b2b.engagements
    WHERE company_id = _company
      AND status = 'active'
      AND ends_at > now()
      AND _user = ANY(assigned_levoro_users)
  );
$$;

-- Restrict helper execution to signed-in users only
REVOKE EXECUTE ON FUNCTION b2b.is_company_admin(uuid, uuid)         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION b2b.is_company_member(uuid, uuid)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION b2b.user_company(uuid)                   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION b2b.has_active_support_grant(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION b2b.has_active_engagement(uuid, uuid)    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION b2b.is_company_admin(uuid, uuid)         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION b2b.is_company_member(uuid, uuid)        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION b2b.user_company(uuid)                   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION b2b.has_active_support_grant(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION b2b.has_active_engagement(uuid, uuid)    TO authenticated, service_role;

-- =====================================================================
-- RLS POLICIES
-- =====================================================================

-- companies
CREATE POLICY companies_select_member ON b2b.companies FOR SELECT TO authenticated
  USING (b2b.is_company_member(auth.uid(), id));
CREATE POLICY companies_select_admin ON b2b.companies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY companies_admin_insert ON b2b.companies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY companies_admin_update ON b2b.companies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY companies_admin_delete ON b2b.companies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY companies_company_admin_update ON b2b.companies FOR UPDATE TO authenticated
  USING (b2b.is_company_admin(auth.uid(), id))
  WITH CHECK (b2b.is_company_admin(auth.uid(), id));

-- Column-level: company_admin may not change commercial/billing fields
REVOKE UPDATE ON b2b.companies FROM authenticated;
GRANT UPDATE (name, tier, primary_contact_user_id) ON b2b.companies TO authenticated;
GRANT UPDATE ON b2b.companies TO service_role;

-- profiles (additive)
CREATE POLICY profiles_select_company_admin ON public.profiles FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND b2b.is_company_admin(auth.uid(), company_id));
CREATE POLICY profiles_select_admin_with_grant ON public.profiles FOR SELECT TO authenticated
  USING (
    company_id IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
    AND b2b.has_active_support_grant(auth.uid(), company_id)
  );
CREATE POLICY profiles_update_company_admin ON public.profiles FOR UPDATE TO authenticated
  USING (company_id IS NOT NULL AND b2b.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND b2b.is_company_admin(auth.uid(), company_id));

-- courses (additive)
CREATE POLICY courses_select_company_member ON public.courses FOR SELECT TO authenticated
  USING (owner_company_id IS NOT NULL AND b2b.is_company_member(auth.uid(), owner_company_id));
CREATE POLICY courses_select_admin_engagement ON public.courses FOR SELECT TO authenticated
  USING (
    owner_company_id IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
    AND b2b.has_active_engagement(auth.uid(), owner_company_id)
  );
CREATE POLICY courses_update_admin_engagement ON public.courses FOR UPDATE TO authenticated
  USING (
    owner_company_id IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
    AND b2b.has_active_engagement(auth.uid(), owner_company_id)
  )
  WITH CHECK (
    owner_company_id IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
    AND b2b.has_active_engagement(auth.uid(), owner_company_id)
  );
CREATE POLICY courses_insert_admin_engagement ON public.courses FOR INSERT TO authenticated
  WITH CHECK (
    owner_company_id IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
    AND b2b.has_active_engagement(auth.uid(), owner_company_id)
  );

-- lessons (additive)
CREATE POLICY lessons_select_company_member ON public.lessons FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = lessons.course_id
      AND c.owner_company_id IS NOT NULL
      AND b2b.is_company_member(auth.uid(), c.owner_company_id)
  ));
CREATE POLICY lessons_all_admin_engagement ON public.lessons FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = lessons.course_id
      AND c.owner_company_id IS NOT NULL
      AND public.has_role(auth.uid(), 'admin')
      AND b2b.has_active_engagement(auth.uid(), c.owner_company_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = lessons.course_id
      AND c.owner_company_id IS NOT NULL
      AND public.has_role(auth.uid(), 'admin')
      AND b2b.has_active_engagement(auth.uid(), c.owner_company_id)
  ));

-- enrolments
CREATE POLICY enrolments_select_self ON b2b.enrolments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY enrolments_select_company_admin ON b2b.enrolments FOR SELECT TO authenticated
  USING (b2b.is_company_admin(auth.uid(), b2b.user_company(user_id)));
CREATE POLICY enrolments_select_admin_grant ON b2b.enrolments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND b2b.has_active_support_grant(auth.uid(), b2b.user_company(user_id))
  );
CREATE POLICY enrolments_insert_company_admin ON b2b.enrolments FOR INSERT TO authenticated
  WITH CHECK (b2b.is_company_admin(auth.uid(), b2b.user_company(user_id)));
CREATE POLICY enrolments_update_company_admin ON b2b.enrolments FOR UPDATE TO authenticated
  USING (b2b.is_company_admin(auth.uid(), b2b.user_company(user_id)))
  WITH CHECK (b2b.is_company_admin(auth.uid(), b2b.user_company(user_id)));
CREATE POLICY enrolments_delete_company_admin ON b2b.enrolments FOR DELETE TO authenticated
  USING (b2b.is_company_admin(auth.uid(), b2b.user_company(user_id)));

-- lesson_progress
CREATE POLICY lp_select_self ON b2b.lesson_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY lp_select_company_admin ON b2b.lesson_progress FOR SELECT TO authenticated
  USING (b2b.is_company_admin(auth.uid(), b2b.user_company(user_id)));
CREATE POLICY lp_select_admin_grant ON b2b.lesson_progress FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND b2b.has_active_support_grant(auth.uid(), b2b.user_company(user_id))
  );
CREATE POLICY lp_insert_self ON b2b.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY lp_update_self ON b2b.lesson_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- access_grants
CREATE POLICY grants_select_company_admin ON b2b.access_grants FOR SELECT TO authenticated
  USING (b2b.is_company_admin(auth.uid(), company_id));
CREATE POLICY grants_select_self ON b2b.access_grants FOR SELECT TO authenticated
  USING (auth.uid() = granted_to_user_id);
CREATE POLICY grants_insert_company_admin ON b2b.access_grants FOR INSERT TO authenticated
  WITH CHECK (b2b.is_company_admin(auth.uid(), company_id));
CREATE POLICY grants_update_company_admin ON b2b.access_grants FOR UPDATE TO authenticated
  USING (b2b.is_company_admin(auth.uid(), company_id))
  WITH CHECK (b2b.is_company_admin(auth.uid(), company_id));

-- engagements
CREATE POLICY engagements_select_admin ON b2b.engagements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY engagements_select_company_admin ON b2b.engagements FOR SELECT TO authenticated
  USING (b2b.is_company_admin(auth.uid(), company_id));
CREATE POLICY engagements_insert_admin ON b2b.engagements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY engagements_update_admin ON b2b.engagements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY engagements_delete_admin ON b2b.engagements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- audit_logs — company_admin SELECT only; admin INSERT only; NO admin SELECT.
CREATE POLICY audit_select_company_admin ON b2b.audit_logs FOR SELECT TO authenticated
  USING (b2b.is_company_admin(auth.uid(), company_id));
CREATE POLICY audit_insert_admin ON b2b.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Default table grants for b2b
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA b2b TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA b2b TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA b2b GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

-- Seed: one company. Auth users must be created via the dashboard; see plan.
INSERT INTO b2b.companies (name, tier, seat_count, license_status, billing_status)
VALUES ('Acme Test Co', 'tier_2', 25, 'active', 'current')
ON CONFLICT DO NOTHING;
