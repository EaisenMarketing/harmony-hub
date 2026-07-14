
-- 1. Add primary_instrument column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_instrument text;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_primary_instrument_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_primary_instrument_check
CHECK (primary_instrument IS NULL OR primary_instrument IN
  ('piano','guitar','electric_guitar','bass','drums','trumpet','production'));

-- 2. Reset all existing users to NULL so they must pick an instrument on next login
UPDATE public.profiles SET primary_instrument = NULL;

-- 3. Function: has_instrument_access
CREATE OR REPLACE FUNCTION public.has_instrument_access(_user_id uuid, _instrument text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = _user_id
        AND primary_instrument = _instrument
    );
$$;

GRANT EXECUTE ON FUNCTION public.has_instrument_access(uuid, text) TO anon, authenticated;

-- 4. Get user's primary instrument helper
CREATE OR REPLACE FUNCTION public.get_user_instrument(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT primary_instrument FROM public.profiles WHERE user_id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_instrument(uuid) TO anon, authenticated;

-- 5. Update has_course_access to enforce instrument matching
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = _course_id AND c.instructor_id = _user_id)
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = _user_id AND e.course_id = _course_id
        AND e.status = 'active'
        AND (e.expires_at IS NULL OR e.expires_at > now())
    )
    OR EXISTS (
      SELECT 1 FROM public.courses c, public.profiles p
      WHERE c.id = _course_id
        AND p.user_id = _user_id
        AND p.primary_instrument IS NOT NULL
        AND (
          -- Production plan → access to production courses
          (p.primary_instrument = 'production' AND c.required_plan = 'production')
          OR
          -- Instrument plan → access to courses of that instrument (non-production)
          (c.required_plan <> 'production' AND c.instrument IS NOT NULL
           AND c.instrument::text = p.primary_instrument)
        )
    );
$$;
