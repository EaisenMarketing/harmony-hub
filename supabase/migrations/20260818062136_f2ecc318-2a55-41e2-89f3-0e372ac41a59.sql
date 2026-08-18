CREATE OR REPLACE FUNCTION public.unsubscribe_email(_email text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN false;
  END IF;
  INSERT INTO public.email_unsubscribes (email, reason)
  VALUES (lower(trim(_email)), 'one_click')
  ON CONFLICT (email) DO NOTHING;
  RETURN true;
END; $$;

GRANT EXECUTE ON FUNCTION public.unsubscribe_email(text) TO anon, authenticated;