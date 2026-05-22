
CREATE TABLE public.lesson_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.lesson_files ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view all lesson files" ON public.lesson_files FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert lesson files" ON public.lesson_files FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update lesson files" ON public.lesson_files FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete lesson files" ON public.lesson_files FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Instructors can manage files for their own course lessons
CREATE POLICY "Instructors can view own course lesson files" ON public.lesson_files FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM lessons JOIN courses ON courses.id = lessons.course_id WHERE lessons.id = lesson_files.lesson_id AND courses.instructor_id = auth.uid()));
CREATE POLICY "Instructors can insert own course lesson files" ON public.lesson_files FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM lessons JOIN courses ON courses.id = lessons.course_id WHERE lessons.id = lesson_files.lesson_id AND courses.instructor_id = auth.uid()) AND has_role(auth.uid(), 'instructor'::app_role));
CREATE POLICY "Instructors can delete own course lesson files" ON public.lesson_files FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM lessons JOIN courses ON courses.id = lessons.course_id WHERE lessons.id = lesson_files.lesson_id AND courses.instructor_id = auth.uid()));

-- Students can view files of published course lessons
CREATE POLICY "Students can view published lesson files" ON public.lesson_files FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM lessons JOIN courses ON courses.id = lessons.course_id WHERE lessons.id = lesson_files.lesson_id AND courses.status = 'published'::course_status));
