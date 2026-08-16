
CREATE POLICY "Instructors manage modules of own courses"
ON public.course_modules FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_modules.course_id AND c.created_by = auth.uid() AND public.has_role(auth.uid(),'instructor')))
WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_modules.course_id AND c.created_by = auth.uid() AND public.has_role(auth.uid(),'instructor')));

CREATE POLICY "Instructors manage lessons of own courses"
ON public.lessons FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = lessons.module_id AND c.created_by = auth.uid() AND public.has_role(auth.uid(),'instructor')))
WITH CHECK (EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = lessons.module_id AND c.created_by = auth.uid() AND public.has_role(auth.uid(),'instructor')));

CREATE POLICY "Instructors upload course content"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-content' AND public.has_role(auth.uid(),'instructor'));

CREATE POLICY "Instructors read course content"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'course-content' AND public.has_role(auth.uid(),'instructor'));

CREATE POLICY "Instructors update course content"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-content' AND public.has_role(auth.uid(),'instructor'));

CREATE POLICY "Instructors delete course content"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-content' AND public.has_role(auth.uid(),'instructor'));
