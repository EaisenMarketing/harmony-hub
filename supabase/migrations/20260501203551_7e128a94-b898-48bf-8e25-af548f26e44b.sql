
-- Revoke column-level access to Zoom credentials from anon and authenticated
REVOKE SELECT (zoom_meeting_id, zoom_join_url) ON public.live_classes FROM anon, authenticated;

-- Re-grant SELECT on all other columns to anon and authenticated
GRANT SELECT (id, title, description, instructor_id, instrument, scheduled_at, duration_minutes, required_plan, max_attendees, is_recorded, recording_url, created_at)
ON public.live_classes TO anon, authenticated;

-- Create a secure view that exposes Zoom credentials only to authorized users:
-- - Admins
-- - The instructor of the class
-- - Authenticated users registered to the class with active subscription
CREATE OR REPLACE VIEW public.live_classes_with_zoom
WITH (security_invoker = true)
AS
SELECT 
  lc.id,
  lc.title,
  lc.description,
  lc.instructor_id,
  lc.instrument,
  lc.scheduled_at,
  lc.duration_minutes,
  lc.required_plan,
  lc.max_attendees,
  lc.is_recorded,
  lc.recording_url,
  lc.created_at,
  lc.zoom_meeting_id,
  lc.zoom_join_url
FROM public.live_classes lc
WHERE 
  public.has_role(auth.uid(), 'admin'::app_role)
  OR lc.instructor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.live_class_registrations r
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE r.live_class_id = lc.id
      AND r.user_id = auth.uid()
      AND p.subscription_status = 'active'
  );

GRANT SELECT ON public.live_classes_with_zoom TO authenticated;
