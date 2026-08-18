DROP FUNCTION IF EXISTS public.teacher_stripe_status(uuid);
DROP FUNCTION IF EXISTS public.save_teacher_stripe_settings(uuid, text, text, numeric, text, text);
DROP FUNCTION IF EXISTS public.disconnect_teacher_stripe(uuid);
DROP TABLE IF EXISTS public.teacher_stripe_settings;

-- Guarda el precio/moneda del estudio sin tocar el estado de Stripe Connect.
CREATE OR REPLACE FUNCTION public.save_studio_pricing(_account_id uuid, _monthly_price numeric, _currency text)
RETURNS TABLE(ok boolean, message text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.owns_teacher_account(_account_id) THEN
    RETURN QUERY SELECT false, 'not_authorized'; RETURN;
  END IF;
  INSERT INTO public.teacher_stripe_accounts (account_id, monthly_price, default_currency)
  VALUES (_account_id, _monthly_price, COALESCE(NULLIF(TRIM(_currency), ''), 'USD'))
  ON CONFLICT (account_id) DO UPDATE
    SET monthly_price = EXCLUDED.monthly_price,
        default_currency = EXCLUDED.default_currency;
  RETURN QUERY SELECT true, 'saved';
END; $$;

CREATE OR REPLACE FUNCTION public.save_studio_email_settings(
  _account_id uuid, _from_name text, _reply_to_email text,
  _logo_url text DEFAULT NULL, _brand_color text DEFAULT NULL)
RETURNS TABLE(ok boolean, message text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.owns_teacher_account(_account_id) THEN
    RETURN QUERY SELECT false, 'not_authorized'; RETURN;
  END IF;
  IF _reply_to_email IS NOT NULL AND TRIM(_reply_to_email) <> ''
     AND _reply_to_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN QUERY SELECT false, 'invalid_email'; RETURN;
  END IF;
  INSERT INTO public.teacher_email_settings (account_id, from_name, reply_to_email, logo_url, brand_color)
  VALUES (_account_id, NULLIF(TRIM(COALESCE(_from_name,'')), ''), NULLIF(TRIM(COALESCE(_reply_to_email,'')), ''),
          NULLIF(TRIM(COALESCE(_logo_url,'')), ''), NULLIF(TRIM(COALESCE(_brand_color,'')), ''))
  ON CONFLICT (account_id) DO UPDATE
    SET from_name = EXCLUDED.from_name,
        reply_to_email = EXCLUDED.reply_to_email,
        logo_url = EXCLUDED.logo_url,
        brand_color = EXCLUDED.brand_color;
  RETURN QUERY SELECT true, 'saved';
END; $$;