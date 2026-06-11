
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.instructor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  instrument text NOT NULL,
  years_experience integer NOT NULL DEFAULT 0,
  bio text NOT NULL,
  presentation_video_url text,
  sample_class_url text,
  availability text,
  timezone text DEFAULT 'America/Mexico_City',
  status public.application_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.instructor_applications TO authenticated;
GRANT INSERT ON public.instructor_applications TO anon, authenticated;
GRANT UPDATE, DELETE ON public.instructor_applications TO authenticated;
GRANT ALL ON public.instructor_applications TO service_role;

ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can submit an application
CREATE POLICY "Anyone can submit applications"
  ON public.instructor_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read applications
CREATE POLICY "Admins can read applications"
  ON public.instructor_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update applications (approve/reject/notes)
CREATE POLICY "Admins can update applications"
  ON public.instructor_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications"
  ON public.instructor_applications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_instructor_applications_updated_at
  BEFORE UPDATE ON public.instructor_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_instructor_applications_status ON public.instructor_applications(status, created_at DESC);
