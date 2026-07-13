GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_pro_access(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO anon, authenticated;
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.live_classes TO anon;
GRANT SELECT ON public.course_modules TO anon;
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT ON public.instructor_profiles TO anon;