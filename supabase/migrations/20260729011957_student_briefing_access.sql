-- Allow an approved instructor to read their own students' progress signals
-- (needed for the pre-class "student briefing" feature).

CREATE OR REPLACE FUNCTION public.is_instructor_of_student(_instructor_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.instructor_students ist
    JOIN public.instructor_profiles ip ON ip.id = ist.instructor_id
    WHERE ip.user_id = _instructor_user_id
      AND ist.student_id = _student_id
      AND ip.status = 'approved'
      AND ist.status = 'active'
  ) OR public.has_role(_instructor_user_id, 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.is_instructor_of_student(uuid, uuid) TO authenticated;

CREATE POLICY "Instructors view assigned students' practice sessions"
ON public.practice_sessions FOR SELECT
USING (public.is_instructor_of_student(auth.uid(), user_id));

CREATE POLICY "Instructors view assigned students' lesson notes"
ON public.lesson_notes FOR SELECT
USING (public.is_instructor_of_student(auth.uid(), user_id));

CREATE POLICY "Instructors view assigned students' ear training sessions"
ON public.ear_training_sessions FOR SELECT
USING (public.is_instructor_of_student(auth.uid(), user_id));

CREATE POLICY "Instructors view assigned students' lesson progress"
ON public.lesson_progress FOR SELECT
USING (public.is_instructor_of_student(auth.uid(), user_id));
