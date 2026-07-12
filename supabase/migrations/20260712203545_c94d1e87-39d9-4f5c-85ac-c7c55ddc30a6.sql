
CREATE TABLE IF NOT EXISTS public.contact_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  source text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_leads TO authenticated;
GRANT ALL ON public.contact_leads TO service_role;

ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact"
  ON public.contact_leads FOR INSERT
  WITH CHECK (
    length(full_name) BETWEEN 2 AND 100
    AND length(email) BETWEEN 5 AND 255
    AND length(message) BETWEEN 10 AND 2000
  );

CREATE POLICY "Admins read contact leads"
  ON public.contact_leads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update contact leads"
  ON public.contact_leads FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete contact leads"
  ON public.contact_leads FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_contact_leads_updated_at
  BEFORE UPDATE ON public.contact_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
