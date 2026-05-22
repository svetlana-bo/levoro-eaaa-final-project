-- 1. Newsletter subscribers: validate email format on INSERT
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe with valid email"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 2. Lesson progress: restrict writes to authenticated role only
DROP POLICY IF EXISTS "Students can insert own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Students can update own progress" ON public.lesson_progress;

CREATE POLICY "Students can insert own progress"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own progress"
  ON public.lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);