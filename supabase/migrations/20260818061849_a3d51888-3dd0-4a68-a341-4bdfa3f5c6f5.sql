-- ============ CRM del maestro ============
CREATE TABLE IF NOT EXISTS public.teacher_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_account_id uuid NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  instrument text,
  source text NOT NULL DEFAULT 'manual',
  stage text NOT NULL DEFAULT 'new',
  notes text,
  message text,
  marketing_opt_in boolean NOT NULL DEFAULT true,
  last_contacted_at timestamptz,
  converted_student_id uuid REFERENCES public.teacher_students(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teacher_leads_account ON public.teacher_leads(teacher_account_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_leads TO authenticated;
GRANT ALL ON public.teacher_leads TO service_role;
ALTER TABLE public.teacher_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages leads" ON public.teacher_leads
  FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_teacher_account(teacher_account_id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_teacher_leads_updated BEFORE UPDATE ON public.teacher_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.teacher_lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.teacher_leads(id) ON DELETE CASCADE,
  teacher_account_id uuid NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note',
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.teacher_lead_activities(lead_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_lead_activities TO authenticated;
GRANT ALL ON public.teacher_lead_activities TO service_role;
ALTER TABLE public.teacher_lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages lead activities" ON public.teacher_lead_activities
  FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_teacher_account(teacher_account_id) OR public.has_role(auth.uid(),'admin'));

-- ============ Campañas de email ============
CREATE TABLE IF NOT EXISTS public.teacher_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_account_id uuid NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  cta_label text,
  cta_url text,
  audience text NOT NULL DEFAULT 'leads',
  stage_filter text,
  status text NOT NULL DEFAULT 'draft',
  recipients_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_campaigns TO authenticated;
GRANT ALL ON public.teacher_campaigns TO service_role;
ALTER TABLE public.teacher_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages campaigns" ON public.teacher_campaigns
  FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_teacher_account(teacher_account_id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_teacher_campaigns_updated BEFORE UPDATE ON public.teacher_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Bitácora de emails ============
CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_account_id uuid REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.teacher_campaigns(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.teacher_leads(id) ON DELETE SET NULL,
  user_id uuid,
  template text NOT NULL,
  recipient_email text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'sent',
  provider_id text,
  error_message text,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_log_created ON public.email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_account ON public.email_log(teacher_account_id, created_at DESC);

GRANT SELECT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner reads own email log" ON public.email_log
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR (teacher_account_id IS NOT NULL AND public.owns_teacher_account(teacher_account_id))
  );

-- ============ Bajas de marketing ============
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  email text PRIMARY KEY,
  teacher_account_id uuid REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_unsubscribes TO authenticated;
GRANT ALL ON public.email_unsubscribes TO service_role;
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read unsubscribes" ON public.email_unsubscribes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ Captura pública de leads ============
CREATE OR REPLACE FUNCTION public.submit_teacher_lead(
  _invite_code text,
  _full_name text,
  _email text,
  _phone text DEFAULT NULL,
  _instrument text DEFAULT NULL,
  _message text DEFAULT NULL
) RETURNS TABLE(ok boolean, message text, studio_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE a public.teacher_accounts;
BEGIN
  IF _full_name IS NULL OR length(trim(_full_name)) = 0 THEN
    RETURN QUERY SELECT false,'name_required',NULL::text; RETURN;
  END IF;
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN QUERY SELECT false,'invalid_email',NULL::text; RETURN;
  END IF;

  SELECT * INTO a FROM public.teacher_accounts WHERE invite_code = _invite_code LIMIT 1;
  IF a.id IS NULL THEN RETURN QUERY SELECT false,'invalid_code',NULL::text; RETURN; END IF;

  INSERT INTO public.teacher_leads
    (teacher_account_id, full_name, email, phone, instrument, message, source, stage)
  VALUES (a.id, trim(_full_name), lower(trim(_email)), _phone,
          COALESCE(_instrument, a.primary_instrument), _message, 'form', 'new');

  RETURN QUERY SELECT true,'created',a.studio_name;
END; $$;

GRANT EXECUTE ON FUNCTION public.submit_teacher_lead(text,text,text,text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.crm_stats(_account_id uuid)
RETURNS TABLE(total integer, new_leads integer, contacted integer, trials integer, enrolled integer, lost integer, emails_30d integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    (SELECT COUNT(*)::int FROM public.teacher_leads WHERE teacher_account_id = _account_id),
    (SELECT COUNT(*)::int FROM public.teacher_leads WHERE teacher_account_id = _account_id AND stage = 'new'),
    (SELECT COUNT(*)::int FROM public.teacher_leads WHERE teacher_account_id = _account_id AND stage = 'contacted'),
    (SELECT COUNT(*)::int FROM public.teacher_leads WHERE teacher_account_id = _account_id AND stage = 'trial'),
    (SELECT COUNT(*)::int FROM public.teacher_leads WHERE teacher_account_id = _account_id AND stage = 'enrolled'),
    (SELECT COUNT(*)::int FROM public.teacher_leads WHERE teacher_account_id = _account_id AND stage = 'lost'),
    (SELECT COUNT(*)::int FROM public.email_log WHERE teacher_account_id = _account_id AND created_at > now() - interval '30 days')
  WHERE public.owns_teacher_account(_account_id) OR public.has_role(auth.uid(),'admin');
$$;