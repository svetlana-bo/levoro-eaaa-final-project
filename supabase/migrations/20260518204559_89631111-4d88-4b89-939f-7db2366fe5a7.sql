-- Helper: is _user_id a member of the company that owns _course_id?
create or replace function public.is_company_member_of_course(_course_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses c
    join public.instructor_company_members m
      on m.company_id = c.owner_id and m.user_id = _user_id
    where c.id = _course_id and c.owner_type = 'company'
  )
$$;

-- COURSES
create policy "Company members can view company courses"
on public.courses for select to authenticated
using (public.is_company_member_of_course(id, auth.uid()));

create policy "Company members can update company courses"
on public.courses for update to authenticated
using (public.is_company_member_of_course(id, auth.uid()))
with check (public.is_company_member_of_course(id, auth.uid()));

create policy "Company members can delete draft company courses"
on public.courses for delete to authenticated
using (public.is_company_member_of_course(id, auth.uid()) and status = 'draft'::course_status);

-- LESSONS
create policy "Company members can view company lessons"
on public.lessons for select to authenticated
using (public.is_company_member_of_course(course_id, auth.uid()));

create policy "Company members can insert company lessons"
on public.lessons for insert to authenticated
with check (public.is_company_member_of_course(course_id, auth.uid()));

create policy "Company members can update company lessons"
on public.lessons for update to authenticated
using (public.is_company_member_of_course(course_id, auth.uid()))
with check (public.is_company_member_of_course(course_id, auth.uid()));

create policy "Company members can delete company lessons"
on public.lessons for delete to authenticated
using (public.is_company_member_of_course(course_id, auth.uid()));

-- LESSON FILES (joined via lesson -> course)
create policy "Company members can view company lesson files"
on public.lesson_files for select to authenticated
using (exists (
  select 1 from public.lessons l
  where l.id = lesson_files.lesson_id
    and public.is_company_member_of_course(l.course_id, auth.uid())
));

create policy "Company members can insert company lesson files"
on public.lesson_files for insert to authenticated
with check (exists (
  select 1 from public.lessons l
  where l.id = lesson_files.lesson_id
    and public.is_company_member_of_course(l.course_id, auth.uid())
));

create policy "Company members can update company lesson files"
on public.lesson_files for update to authenticated
using (exists (
  select 1 from public.lessons l
  where l.id = lesson_files.lesson_id
    and public.is_company_member_of_course(l.course_id, auth.uid())
))
with check (exists (
  select 1 from public.lessons l
  where l.id = lesson_files.lesson_id
    and public.is_company_member_of_course(l.course_id, auth.uid())
));

create policy "Company members can delete company lesson files"
on public.lesson_files for delete to authenticated
using (exists (
  select 1 from public.lessons l
  where l.id = lesson_files.lesson_id
    and public.is_company_member_of_course(l.course_id, auth.uid())
));

-- COURSE SUBCATEGORIES
create policy "Company members can insert company course subcategories"
on public.course_subcategories for insert to authenticated
with check (public.is_company_member_of_course(course_id, auth.uid()));

create policy "Company members can delete company course subcategories"
on public.course_subcategories for delete to authenticated
using (public.is_company_member_of_course(course_id, auth.uid()));

-- INSTRUCTOR COMPANIES — members can edit their shared company profile
create policy "Members can update their company"
on public.instructor_companies for update to authenticated
using (exists (
  select 1 from public.instructor_company_members m
  where m.company_id = instructor_companies.id and m.user_id = auth.uid()
))
with check (exists (
  select 1 from public.instructor_company_members m
  where m.company_id = instructor_companies.id and m.user_id = auth.uid()
));