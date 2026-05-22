
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'instructor_company_members_user_id_key'
  ) THEN
    ALTER TABLE public.instructor_company_members
      ADD CONSTRAINT instructor_company_members_user_id_key UNIQUE (user_id);
  END IF;
END $$;
