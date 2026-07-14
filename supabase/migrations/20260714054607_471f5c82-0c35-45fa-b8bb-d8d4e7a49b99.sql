
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_pro_access(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) TO anon, authenticated;

-- Scope admin-only policies so they don't run for anon users and break public reads
DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials"
ON public.testimonials
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
