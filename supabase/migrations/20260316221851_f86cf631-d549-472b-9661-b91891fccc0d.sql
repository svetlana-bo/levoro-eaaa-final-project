
CREATE TABLE public.student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  selected_text text,
  note_content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own notes" ON public.student_notes FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own notes" ON public.student_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own notes" ON public.student_notes FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can delete own notes" ON public.student_notes FOR DELETE TO authenticated USING (auth.uid() = student_id);
