-- ============ Stripe Connect por estudio (B2B) ============
CREATE TABLE public.teacher_stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL UNIQUE REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  stripe_account_id text,
  status text NOT NULL DEFAULT 'not_connected',
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  default_currency text NOT NULL DEFAULT 'USD',
  monthly_price numeric,
  application_fee_bps integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.teacher_stripe_accounts TO authenticated;
GRANT ALL ON public.teacher_stripe_accounts TO service_role;
ALTER TABLE public.teacher_stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own stripe account"
ON public.teacher_stripe_accounts FOR SELECT TO authenticated
USING (public.owns_teacher_account(account_id));

CREATE TRIGGER trg_teacher_stripe_accounts_updated
BEFORE UPDATE ON public.teacher_stripe_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Configuración de correo por estudio ============
CREATE TABLE public.teacher_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL UNIQUE REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  from_name text,
  reply_to_email text,
  logo_url text,
  brand_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_email_settings TO authenticated;
GRANT ALL ON public.teacher_email_settings TO service_role;
ALTER TABLE public.teacher_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own email settings"
ON public.teacher_email_settings FOR ALL TO authenticated
USING (public.owns_teacher_account(account_id))
WITH CHECK (public.owns_teacher_account(account_id));

CREATE TRIGGER trg_teacher_email_settings_updated
BEFORE UPDATE ON public.teacher_email_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Estado de pagos del estudio (dueño) ============
CREATE OR REPLACE FUNCTION public.studio_payment_status(_account_id uuid)
RETURNS TABLE(status text, stripe_account_id text, charges_enabled boolean,
              payouts_enabled boolean, details_submitted boolean,
              monthly_price numeric, default_currency text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.status, a.stripe_account_id, a.charges_enabled, a.payouts_enabled,
         a.details_submitted, a.monthly_price, a.default_currency
  FROM public.teacher_stripe_accounts a
  WHERE a.account_id = _account_id AND public.owns_teacher_account(_account_id);
$$;

-- ============ Vista del admin: sólo conectado sí/no, sin datos sensibles ============
CREATE OR REPLACE FUNCTION public.admin_studio_payment_status()
RETURNS TABLE(account_id uuid, connected boolean, charges_enabled boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ta.id,
         COALESCE(sa.status = 'connected', false),
         COALESCE(sa.charges_enabled, false)
  FROM public.teacher_accounts ta
  LEFT JOIN public.teacher_stripe_accounts sa ON sa.account_id = ta.id
  WHERE public.has_role(auth.uid(), 'admin');
$$;

-- ============ Identidad de correo del estudio para las funciones edge ============
CREATE OR REPLACE FUNCTION public.studio_email_identity(_account_id uuid)
RETURNS TABLE(studio_name text, from_name text, reply_to_email text, logo_url text, brand_color text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ta.studio_name,
         COALESCE(NULLIF(TRIM(es.from_name), ''), ta.studio_name),
         COALESCE(NULLIF(TRIM(es.reply_to_email), ''), ta.contact_email),
         es.logo_url, es.brand_color
  FROM public.teacher_accounts ta
  LEFT JOIN public.teacher_email_settings es ON es.account_id = ta.id
  WHERE ta.id = _account_id;
$$;

-- ============ Deja de usar el esquema viejo de llaves manuales ============
UPDATE public.teacher_stripe_settings SET secret_key = NULL;
ALTER TABLE public.teacher_stripe_settings DROP COLUMN IF EXISTS secret_key;