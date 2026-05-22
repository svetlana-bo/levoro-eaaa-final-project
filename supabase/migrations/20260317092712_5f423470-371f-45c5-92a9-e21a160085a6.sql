-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('course-media', 'course-media', true);

-- Storage policies for course-media bucket
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-media');
CREATE POLICY "Anyone can view course media" ON storage.objects FOR SELECT USING (bucket_id = 'course-media');
CREATE POLICY "Users can update own media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'course-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create modules table
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add module_id to lessons (nullable - modules are optional)
ALTER TABLE public.lessons ADD COLUMN module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL;

-- RLS for modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view modules of published courses" ON public.modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.status = 'published'::course_status)
);

CREATE POLICY "Admins can view all modules" ON public.modules FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Instructors can view own course modules" ON public.modules FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.instructor_id = auth.uid())
);

CREATE POLICY "Instructors can insert modules for own courses" ON public.modules FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.instructor_id = auth.uid())
  AND has_role(auth.uid(), 'instructor'::app_role)
);

CREATE POLICY "Instructors can update own course modules" ON public.modules FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.instructor_id = auth.uid())
);

CREATE POLICY "Instructors can delete own course modules" ON public.modules FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.instructor_id = auth.uid())
);