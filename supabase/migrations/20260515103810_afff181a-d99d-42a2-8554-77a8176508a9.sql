
CREATE OR REPLACE FUNCTION public.get_course_lesson_outline(_course_id uuid)
RETURNS TABLE (id uuid, title text, order_index integer, module_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id, l.title, l.order_index, l.module_id
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  WHERE l.course_id = _course_id
    AND c.status = 'published'
  ORDER BY l.order_index;
$$;

GRANT EXECUTE ON FUNCTION public.get_course_lesson_outline(uuid) TO anon, authenticated;
