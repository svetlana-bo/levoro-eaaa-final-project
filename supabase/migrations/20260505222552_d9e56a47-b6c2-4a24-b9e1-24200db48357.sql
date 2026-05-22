
-- 1. sql-databases: add DELETE policy
CREATE POLICY "Users can delete own sql-databases files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'sql-databases'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Lessons: align DELETE policy to also require instructor role
DROP POLICY IF EXISTS "Instructors can delete own course lessons" ON public.lessons;
CREATE POLICY "Instructors can delete own course lessons"
ON public.lessons FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = lessons.course_id AND c.instructor_id = auth.uid()
  )
);

-- 3. Modules: align UPDATE and DELETE policies to require instructor role
DROP POLICY IF EXISTS "Instructors can update own course modules" ON public.modules;
CREATE POLICY "Instructors can update own course modules"
ON public.modules FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = modules.course_id AND c.instructor_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = modules.course_id AND c.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Instructors can delete own course modules" ON public.modules;
CREATE POLICY "Instructors can delete own course modules"
ON public.modules FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = modules.course_id AND c.instructor_id = auth.uid()
  )
);

-- 4. Course subcategories: align DELETE policy to require instructor role
DROP POLICY IF EXISTS "Instructors can delete own course subcategories" ON public.course_subcategories;
CREATE POLICY "Instructors can delete own course subcategories"
ON public.course_subcategories FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_subcategories.course_id AND c.instructor_id = auth.uid()
  )
);
