-- Allow anonymous users to view published courses
CREATE POLICY "Anon can view published courses"
ON public.courses
FOR SELECT
TO anon
USING (status = 'published'::course_status);

-- Allow anonymous users to view lessons of published courses
CREATE POLICY "Anon can view lessons of published courses"
ON public.lessons
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM courses
  WHERE courses.id = lessons.course_id
  AND courses.status = 'published'::course_status
));