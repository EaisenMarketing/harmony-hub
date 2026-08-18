CREATE TABLE public.teacher_stripe_settings (
  account_id UUID PRIMARY KEY REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  publishable_key TEXT,
  secret_key TEXT,
  monthly_price NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_link_url TEXT,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- El maestro puede leer todo excepto su llave secreta (nunca se devuelve al navegador).
GRANT SELECT (account_id, publishable_key, monthly_price, currency, payment_link_url, connected_at, created_at, updated_at) ON public.teacher_stripe_settings TO authenticated;
GRANT ALL ON public.teacher_stripe_settings TO service_role;

ALTER TABLE public.teacher_stripe_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can view their payment settings"
ON public.teacher_stripe_settings FOR SELECT TO authenticated
USING (public.owns_teacher_account(account_id));

CREATE TRIGGER teacher_stripe_settings_updated_at
BEFORE UPDATE ON public.teacher_stripe_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Guardado seguro: la llave secreta sólo entra por esta función y nunca se puede leer de vuelta.
CREATE OR REPLACE FUNCTION public.save_teacher_stripe_settings(
  _account_id UUID,
  _publishable_key TEXT,
  _secret_key TEXT,
  _monthly_price NUMERIC,
  _currency TEXT,
  _payment_link_url TEXT
) RETURNS TABLE(ok BOOLEAN, message TEXT, connected BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  IF NOT public.owns_teacher_account(_account_id) THEN
    RETURN QUERY SELECT false, 'not_authorized', false;
    RETURN;
  END IF;

  SELECT secret_key INTO v_secret FROM public.teacher_stripe_settings WHERE account_id = _account_id;
  IF _secret_key IS NOT NULL AND length(trim(_secret_key)) > 0 THEN
    v_secret := trim(_secret_key);
  END IF;

  INSERT INTO public.teacher_stripe_settings AS t (
    account_id, publishable_key, secret_key, monthly_price, currency, payment_link_url, connected_at
  ) VALUES (
    _account_id,
    nullif(trim(coalesce(_publishable_key, '')), ''),
    v_secret,
    _monthly_price,
    coalesce(nullif(trim(coalesce(_currency, '')), ''), 'USD'),
    nullif(trim(coalesce(_payment_link_url, '')), ''),
    CASE WHEN v_secret IS NOT NULL THEN now() ELSE NULL END
  )
  ON CONFLICT (account_id) DO UPDATE SET
    publishable_key = EXCLUDED.publishable_key,
    secret_key = v_secret,
    monthly_price = EXCLUDED.monthly_price,
    currency = EXCLUDED.currency,
    payment_link_url = EXCLUDED.payment_link_url,
    connected_at = CASE WHEN v_secret IS NOT NULL THEN coalesce(t.connected_at, now()) ELSE NULL END;

  RETURN QUERY SELECT true, 'saved', v_secret IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.teacher_stripe_status(_account_id UUID)
RETURNS TABLE(connected BOOLEAN, publishable_key TEXT, monthly_price NUMERIC, currency TEXT, payment_link_url TEXT, connected_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (s.secret_key IS NOT NULL), s.publishable_key, s.monthly_price, s.currency, s.payment_link_url, s.connected_at
  FROM public.teacher_stripe_settings s
  WHERE s.account_id = _account_id AND public.owns_teacher_account(_account_id);
$$;

CREATE OR REPLACE FUNCTION public.disconnect_teacher_stripe(_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.owns_teacher_account(_account_id) THEN RETURN false; END IF;
  UPDATE public.teacher_stripe_settings
  SET secret_key = NULL, publishable_key = NULL, connected_at = NULL
  WHERE account_id = _account_id;
  RETURN true;
END;
$$;