-- Policies on storage.objects for course-content (now private)
-- Admins manage everything; signed URLs are minted by an edge function using service_role.

DROP POLICY IF EXISTS "Admins can upload course content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update course content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read course content" ON storage.objects;

CREATE POLICY "Admins can read course content"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-content' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload course content"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-content' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update course content"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-content' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'course-content' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete course content"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-content' AND public.has_role(auth.uid(), 'admin'));