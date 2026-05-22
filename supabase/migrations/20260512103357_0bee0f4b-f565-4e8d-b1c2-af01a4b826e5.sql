
ALTER TABLE public.course_reviews ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE public.course_reviews
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS review_date timestamptz;

ALTER TABLE public.course_reviews
  DROP CONSTRAINT IF EXISTS course_reviews_source_check;
ALTER TABLE public.course_reviews
  ADD CONSTRAINT course_reviews_source_check CHECK (source IN ('student','admin'));

-- Ensure admin-sourced rows have no student_id, and student-sourced rows do.
ALTER TABLE public.course_reviews
  DROP CONSTRAINT IF EXISTS course_reviews_source_student_consistency;
ALTER TABLE public.course_reviews
  ADD CONSTRAINT course_reviews_source_student_consistency CHECK (
    (source = 'student' AND student_id IS NOT NULL)
    OR (source = 'admin' AND student_id IS NULL)
  );

CREATE POLICY "Admins can insert reviews"
ON public.course_reviews
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND student_id IS NULL AND source = 'admin');
