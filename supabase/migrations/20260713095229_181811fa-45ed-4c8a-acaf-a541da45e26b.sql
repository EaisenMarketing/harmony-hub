
-- 1. Fix slugify search_path
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' FROM regexp_replace(
    lower(
      translate(
        coalesce(input, ''),
        'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
        'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
      )
    ),
    '[^a-z0-9]+', '-', 'g'
  ))
$$;

-- 2. Revoke EXECUTE from anon on SECURITY DEFINER helpers; keep authenticated
REVOKE EXECUTE ON FUNCTION public.get_user_plan(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_pro_access(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_pro_access(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) TO authenticated, service_role;

-- Trigger-only functions: revoke from everyone except owner/service_role
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_instructor_profile_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3. live_classes: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view upcoming live classes" ON public.live_classes;
CREATE POLICY "Authenticated users can view upcoming live classes"
  ON public.live_classes FOR SELECT
  TO authenticated
  USING (scheduled_at > (now() - interval '1 day'));

-- 4. instructor_applications: tighten WITH CHECK
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.instructor_applications;
CREATE POLICY "Anyone can submit pending applications"
  ON public.instructor_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND full_name IS NOT NULL
    AND email IS NOT NULL
    AND char_length(full_name) BETWEEN 2 AND 200
    AND char_length(email) BETWEEN 5 AND 200
  );

-- 5. community_comments: add UPDATE policy for owners
CREATE POLICY "Users update own comments"
  ON public.community_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. instructor_students: enforce approved instructor on INSERT/UPDATE via WITH CHECK
DROP POLICY IF EXISTS "Instructors can manage own students" ON public.instructor_students;
CREATE POLICY "Instructors can manage own students"
  ON public.instructor_students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.instructor_profiles ip
      WHERE ip.id = instructor_students.instructor_id
        AND ip.user_id = auth.uid()
        AND ip.status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.instructor_profiles ip
      WHERE ip.id = instructor_students.instructor_id
        AND ip.user_id = auth.uid()
        AND ip.status = 'approved'
    )
  );

-- 7. Storage: drop broad SELECT listing policies on public buckets (CDN URLs keep working)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Community media public read" ON storage.objects;
DROP POLICY IF EXISTS "Course content is publicly accessible" ON storage.objects;
