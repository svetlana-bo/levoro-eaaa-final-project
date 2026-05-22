
-- =============================================
-- FINDING 2: Enrollment insert → authenticated only
-- =============================================
DROP POLICY IF EXISTS "Students can insert own enrollments" ON public.enrollments;
CREATE POLICY "Students can insert own enrollments"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- =============================================
-- FINDING 3: Lesson content gating
-- =============================================

-- Drop overly permissive lesson policies
DROP POLICY IF EXISTS "Anon can view lessons of published courses" ON public.lessons;
DROP POLICY IF EXISTS "Students can view lessons of published courses" ON public.lessons;

-- Anon: first lesson only
CREATE POLICY "Anon can view first lesson of published courses"
  ON public.lessons FOR SELECT TO anon
  USING (
    order_index = 0
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
        AND courses.status = 'published'::course_status
    )
  );

-- Authenticated: first lesson, OR free course, OR enrolled
CREATE POLICY "Authenticated can view gated lessons"
  ON public.lessons FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
        AND courses.status = 'published'::course_status
    )
    AND (
      order_index = 0
      OR EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = lessons.course_id AND courses.is_free = true
      )
      OR EXISTS (
        SELECT 1 FROM enrollments
        WHERE enrollments.course_id = lessons.course_id
          AND enrollments.student_id = auth.uid()
      )
    )
  );

-- Lesson files: tighten student policy
DROP POLICY IF EXISTS "Students can view published lesson files" ON public.lesson_files;
CREATE POLICY "Students can view enrolled or free lesson files"
  ON public.lesson_files FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = lesson_files.lesson_id
        AND courses.status = 'published'::course_status
        AND (
          courses.is_free = true
          OR EXISTS (
            SELECT 1 FROM enrollments
            WHERE enrollments.course_id = courses.id
              AND enrollments.student_id = auth.uid()
          )
        )
    )
  );

-- =============================================
-- FINDING 4: Instructor public profiles view → security_definer
-- =============================================

-- Drop the broad profiles policy that exposes all columns
DROP POLICY IF EXISTS "Public can view basic instructor profile fields" ON public.profiles;

-- Recreate view as security definer (owner permissions, bypasses RLS)
CREATE OR REPLACE VIEW public.instructor_public_profiles
WITH (security_invoker = false)
AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.bio,
  p.linkedin_url,
  p.country
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'instructor'::app_role
);

-- =============================================
-- FINDING 5: Block client-side subscription manipulation
-- =============================================

-- Remove client transaction insert
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

-- Trigger to block client-side subscription field updates
CREATE OR REPLACE FUNCTION public.block_subscription_field_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role to update anything
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block changes to subscription columns
  IF (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
     OR (OLD.subscription_plan_name IS DISTINCT FROM NEW.subscription_plan_name)
     OR (OLD.subscription_start_date IS DISTINCT FROM NEW.subscription_start_date)
     OR (OLD.subscription_end_date IS DISTINCT FROM NEW.subscription_end_date)
  THEN
    RAISE EXCEPTION 'Subscription fields can only be updated by the system.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_subscription_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.block_subscription_field_update();
