-- 1. Certificates: remove public read, add scoped policies
DROP POLICY IF EXISTS "Certificates are viewable by everyone" ON public.certificates;
DROP POLICY IF EXISTS "Anyone can view certificates" ON public.certificates;
DROP POLICY IF EXISTS "Public can view certificates" ON public.certificates;

CREATE POLICY "Users can view their own certificates"
ON public.certificates FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = certificates.course_id AND c.instructor_id = auth.uid()
  )
);

-- Public verification via secure function (lookup by code only)
CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE (
  id uuid,
  student_name text,
  course_title text,
  issued_at timestamptz,
  verification_code text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, student_name, course_title, issued_at, verification_code
  FROM public.certificates
  WHERE verification_code = _code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- 2. Assignments: restrict to enrolled users, instructor, admin
DROP POLICY IF EXISTS "Assignments are viewable by everyone" ON public.assignments;
DROP POLICY IF EXISTS "Anyone can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Public can view assignments" ON public.assignments;

CREATE POLICY "Assignments visible to enrolled users, instructor, admin"
ON public.assignments FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = assignments.course_id AND c.instructor_id = auth.uid()
  )
  OR public.has_course_access(auth.uid(), assignments.course_id)
);
