
-- Create course status enum
CREATE TYPE public.course_status AS ENUM ('draft', 'pending_review', 'published');

-- Create courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status course_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Instructors can insert their own courses
CREATE POLICY "Instructors can insert own courses"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = instructor_id AND public.has_role(auth.uid(), 'instructor'));

-- Instructors can update own courses
CREATE POLICY "Instructors can update own courses"
ON public.courses FOR UPDATE TO authenticated
USING (auth.uid() = instructor_id AND public.has_role(auth.uid(), 'instructor'))
WITH CHECK (auth.uid() = instructor_id);

-- Instructors can view own courses
CREATE POLICY "Instructors can view own courses"
ON public.courses FOR SELECT TO authenticated
USING (auth.uid() = instructor_id);

-- Admins can view all courses
CREATE POLICY "Admins can view all courses"
ON public.courses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all courses (for approvals)
CREATE POLICY "Admins can update all courses"
ON public.courses FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Students can view published courses
CREATE POLICY "Students can view published courses"
ON public.courses FOR SELECT TO authenticated
USING (status = 'published');

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update user_roles
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can insert user_roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can delete user_roles (for role changes)
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
