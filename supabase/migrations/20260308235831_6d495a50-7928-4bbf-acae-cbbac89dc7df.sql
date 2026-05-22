-- Add is_free column to courses table
ALTER TABLE public.courses 
ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT false;

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- RLS policies for lessons: Published course lessons are viewable by students
CREATE POLICY "Students can view lessons of published courses"
ON public.lessons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lessons.course_id 
    AND courses.status = 'published'
  )
);

-- Instructors can view their own course lessons
CREATE POLICY "Instructors can view own course lessons"
ON public.lessons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- Instructors can insert lessons for their own courses
CREATE POLICY "Instructors can insert own course lessons"
ON public.lessons
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  ) AND has_role(auth.uid(), 'instructor')
);

-- Instructors can update their own course lessons
CREATE POLICY "Instructors can update own course lessons"
ON public.lessons
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- Instructors can delete their own course lessons
CREATE POLICY "Instructors can delete own course lessons"
ON public.lessons
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- Admins can view all lessons
CREATE POLICY "Admins can view all lessons"
ON public.lessons
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, course_id)
);

-- Enable RLS on enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
ON public.enrollments
FOR SELECT
USING (auth.uid() = student_id);

-- Students can insert their own enrollments
CREATE POLICY "Students can insert own enrollments"
ON public.enrollments
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can update their own enrollments
CREATE POLICY "Students can update own enrollments"
ON public.enrollments
FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Instructors can view enrollments for their courses
CREATE POLICY "Instructors can view course enrollments"
ON public.enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = enrollments.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.enrollments
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

-- Enable RLS on lesson_progress
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Students can view their own progress
CREATE POLICY "Students can view own progress"
ON public.lesson_progress
FOR SELECT
USING (auth.uid() = student_id);

-- Students can insert their own progress
CREATE POLICY "Students can insert own progress"
ON public.lesson_progress
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can update their own progress
CREATE POLICY "Students can update own progress"
ON public.lesson_progress
FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Instructors can view progress for their course lessons
CREATE POLICY "Instructors can view course lesson progress"
ON public.lesson_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons
    JOIN public.courses ON courses.id = lessons.course_id
    WHERE lessons.id = lesson_progress.lesson_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- Admins can view all progress
CREATE POLICY "Admins can view all progress"
ON public.lesson_progress
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for better query performance
CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX idx_lessons_order ON public.lessons(course_id, order_index);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_progress_student ON public.lesson_progress(student_id);
CREATE INDEX idx_progress_lesson ON public.lesson_progress(lesson_id);