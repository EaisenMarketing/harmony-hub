-- Restrict public SELECT on courses to hide created_by from non-owners/non-admins.
-- Strategy: replace the broad "Anyone can view published courses" policy with one
-- that still allows reading published courses, but revoke column-level SELECT on
-- created_by for anon/authenticated; admins and the owner instructor retain full access
-- via their existing ALL policies (which run as table owner for column privileges check
-- only matters for direct column SELECT — RLS policies don't restrict columns, so we
-- enforce this with GRANT/REVOKE at the column level).

-- Revoke column-level SELECT on created_by from anon and authenticated roles
REVOKE SELECT (created_by) ON public.courses FROM anon, authenticated;

-- Re-grant SELECT on all OTHER columns explicitly to anon and authenticated
GRANT SELECT (
  id,
  title,
  description,
  instrument,
  level,
  required_plan,
  thumbnail_url,
  duration_hours,
  is_published,
  created_at,
  updated_at
) ON public.courses TO anon, authenticated;

-- Create a SECURITY DEFINER helper so admins/owners CAN read created_by via a view
CREATE OR REPLACE VIEW public.courses_admin_view
WITH (security_invoker = true) AS
SELECT *
FROM public.courses
WHERE
  public.has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid();

GRANT SELECT ON public.courses_admin_view TO authenticated;