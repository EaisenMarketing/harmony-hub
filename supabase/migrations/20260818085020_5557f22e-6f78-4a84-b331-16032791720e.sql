CREATE POLICY "Studio owners upload course content" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-content' AND public.my_teacher_account_id() IS NOT NULL);

CREATE POLICY "Studio owners read course content" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'course-content' AND public.my_teacher_account_id() IS NOT NULL);

CREATE POLICY "Studio owners update course content" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-content' AND public.my_teacher_account_id() IS NOT NULL);

CREATE POLICY "Studio owners delete course content" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-content' AND public.my_teacher_account_id() IS NOT NULL);