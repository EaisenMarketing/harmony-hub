ALTER TABLE public.teacher_accounts
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE UNIQUE INDEX IF NOT EXISTS teacher_accounts_public_slug_uidx
  ON public.teacher_accounts (lower(public_slug));

CREATE OR REPLACE FUNCTION public.reserved_studio_slug(_slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(coalesce(_slug,'')) = ANY (ARRAY[
    'portal','admin','estudio','mi-estudio','instructor','auth','login','logout','registro','register',
    'signup','sign-up','signin','sign-in','cursos','precios','maestros','para-maestros',
    'software-para-maestros','contacto','soporte','clases','clases-en-vivo','baja','material-gratis',
    'invitacion','empezar','adflow','nosotros','terminos','privacidad','politica-de-cancelacion',
    'preguntas-frecuentes','aplicar-maestro','ser-maestro','reset-password','recuperar',
    'recuperar-password','forgot-password','api','assets','static','fonts','public','unirme','partituras'
  ])
$$;

CREATE OR REPLACE FUNCTION public.set_studio_slug(_slug text)
RETURNS TABLE(ok boolean, message text, slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid; v_slug text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false,'not_authenticated',NULL::text; RETURN;
  END IF;

  SELECT id INTO v_id FROM public.teacher_accounts WHERE owner_user_id = auth.uid() LIMIT 1;
  IF v_id IS NULL THEN
    RETURN QUERY SELECT false,'no_studio',NULL::text; RETURN;
  END IF;

  v_slug := public.slugify(_slug);

  IF v_slug IS NULL OR length(v_slug) < 3 OR length(v_slug) > 40 THEN
    RETURN QUERY SELECT false,'invalid_slug',NULL::text; RETURN;
  END IF;

  IF public.reserved_studio_slug(v_slug) THEN
    RETURN QUERY SELECT false,'reserved_slug',NULL::text; RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.teacher_accounts
              WHERE lower(public_slug) = v_slug AND id <> v_id) THEN
    RETURN QUERY SELECT false,'slug_taken',NULL::text; RETURN;
  END IF;

  UPDATE public.teacher_accounts SET public_slug = v_slug WHERE id = v_id;
  RETURN QUERY SELECT true,'ok',v_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.studio_public_profile(_slug text)
RETURNS TABLE(
  studio_name text,
  bio text,
  primary_instrument text,
  avatar_url text,
  invite_code text,
  public_slug text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ta.studio_name, ta.bio, ta.primary_instrument, ta.avatar_url,
         ta.invite_code, ta.public_slug,
         (ta.status = 'active' AND (ta.subscription_expires_at IS NULL OR ta.subscription_expires_at > now()))
           OR (ta.status = 'trial' AND ta.trial_ends_at > now())
  FROM public.teacher_accounts ta
  WHERE lower(ta.public_slug) = lower(coalesce(_slug,''))
     OR ta.invite_code = _slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.studio_public_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_studio_slug(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_studio_invite(_invite_code text)
 RETURNS TABLE(account_id uuid, studio_name text, joined boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_account public.teacher_accounts;
  v_email TEXT;
  v_row public.teacher_students;
  v_used INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'not_authenticated';
    RETURN;
  END IF;

  SELECT * INTO v_account FROM public.teacher_accounts
    WHERE invite_code = _invite_code
       OR lower(public_slug) = lower(coalesce(_invite_code,''))
    LIMIT 1;

  IF v_account.id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'invalid_code';
    RETURN;
  END IF;

  IF v_account.status NOT IN ('trial', 'active') THEN
    RETURN QUERY SELECT v_account.id, v_account.studio_name, false, 'studio_inactive';
    RETURN;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO v_row FROM public.teacher_students
    WHERE teacher_account_id = v_account.id AND student_user_id = auth.uid() LIMIT 1;

  IF v_row.id IS NOT NULL THEN
    IF v_row.status <> 'active' THEN
      UPDATE public.teacher_students
        SET status = 'active', joined_at = COALESCE(joined_at, now())
        WHERE id = v_row.id;
    END IF;
    RETURN QUERY SELECT v_account.id, v_account.studio_name, true, 'already_member';
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO v_used FROM public.teacher_students
    WHERE teacher_account_id = v_account.id AND status <> 'inactive';

  SELECT * INTO v_row FROM public.teacher_students
    WHERE teacher_account_id = v_account.id
      AND lower(email) = lower(v_email)
      AND student_user_id IS NULL
    LIMIT 1;

  IF v_row.id IS NOT NULL THEN
    UPDATE public.teacher_students
      SET student_user_id = auth.uid(), status = 'active', joined_at = now()
      WHERE id = v_row.id;
    RETURN QUERY SELECT v_account.id, v_account.studio_name, true, 'claimed';
    RETURN;
  END IF;

  IF v_used >= v_account.seat_limit THEN
    RETURN QUERY SELECT v_account.id, v_account.studio_name, false, 'seats_full';
    RETURN;
  END IF;

  INSERT INTO public.teacher_students
    (teacher_account_id, student_user_id, full_name, email, instrument, status, joined_at)
  VALUES (
    v_account.id,
    auth.uid(),
    COALESCE((SELECT full_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1), v_email),
    v_email,
    v_account.primary_instrument,
    'active',
    now()
  );

  RETURN QUERY SELECT v_account.id, v_account.studio_name, true, 'joined';
END;
$function$;

CREATE OR REPLACE FUNCTION public.current_entitlement(_user_id uuid)
 RETURNS TABLE(plan_key text, status text, instrument_slug text, level_key text, ai_tool_limit integer, allow_practice_submissions boolean, allow_teacher_feedback boolean, advanced_content boolean, trial_days_left integer, trial_ends_at timestamp with time zone, current_period_end timestamp with time zone, is_admin boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trial public.trials;
  v_sub public.subscriptions;
  v_plan public.plans;
  v_plan_key text;
  v_status text := 'inactive';
  v_ui public.user_instruments;
  v_studio record;
  v_studio_instrument text;
  v_studio_end timestamptz;
BEGIN
  SELECT t.* INTO v_trial FROM public.trials t
    WHERE t.user_id = _user_id AND t.status = 'trialing' AND t.ends_at > now()
    ORDER BY t.started_at DESC LIMIT 1;

  SELECT s.* INTO v_sub FROM public.subscriptions s
    WHERE s.user_id = _user_id AND s.status IN ('active','trialing','past_due')
    ORDER BY s.created_at DESC LIMIT 1;

  IF v_trial.id IS NOT NULL THEN
    v_plan_key := v_trial.plan_key;
    v_status := 'trialing';
  ELSIF v_sub.id IS NOT NULL THEN
    v_plan_key := v_sub.plan::text;
    v_status := 'active';
  END IF;

  -- Estudios de maestros: el maestro y sus alumnos activos reciben acceso Premium
  -- (todas las herramientas de IA) mientras el estudio esté vigente.
  SELECT ta.plan::text AS tplan,
         ta.primary_instrument AS owner_instrument,
         NULL::text AS student_instrument,
         COALESCE(ta.subscription_expires_at, ta.trial_ends_at) AS ends
    INTO v_studio
    FROM public.teacher_accounts ta
   WHERE ta.owner_user_id = _user_id
     AND ((ta.status = 'active' AND (ta.subscription_expires_at IS NULL OR ta.subscription_expires_at > now()))
          OR (ta.status = 'trial' AND ta.trial_ends_at > now()))
   LIMIT 1;

  IF v_studio.tplan IS NULL THEN
    SELECT ta.plan::text AS tplan,
           ta.primary_instrument AS owner_instrument,
           ts.instrument AS student_instrument,
           COALESCE(ta.subscription_expires_at, ta.trial_ends_at) AS ends
      INTO v_studio
      FROM public.teacher_students ts
      JOIN public.teacher_accounts ta ON ta.id = ts.teacher_account_id
     WHERE ts.student_user_id = _user_id
       AND ts.status = 'active'
       AND ((ta.status = 'active' AND (ta.subscription_expires_at IS NULL OR ta.subscription_expires_at > now()))
            OR (ta.status = 'trial' AND ta.trial_ends_at > now()))
     ORDER BY ts.joined_at DESC NULLS LAST
     LIMIT 1;
  END IF;

  IF v_studio.tplan IS NOT NULL THEN
    v_plan_key := 'premium';
    v_status := 'active';
    v_studio_instrument := COALESCE(v_studio.student_instrument, v_studio.owner_instrument);
    v_studio_end := v_studio.ends;
  END IF;

  IF v_plan_key IS NOT NULL THEN
    SELECT p.* INTO v_plan FROM public.plans p WHERE p.key = v_plan_key LIMIT 1;
  END IF;

  SELECT ui.* INTO v_ui FROM public.user_instruments ui
    WHERE ui.user_id = _user_id AND ui.status = 'active' LIMIT 1;

  RETURN QUERY SELECT
    v_plan_key,
    v_status,
    COALESCE(v_ui.instrument_slug, v_studio_instrument),
    v_ui.level_key,
    CASE WHEN v_status = 'trialing' THEN 1 ELSE v_plan.ai_tool_limit END,
    COALESCE(v_plan.allow_practice_submissions, false) AND v_status <> 'trialing',
    COALESCE(v_plan.allow_teacher_feedback, false) AND v_status <> 'trialing',
    COALESCE(v_plan.advanced_content, false) AND v_status <> 'trialing',
    CASE WHEN v_trial.id IS NOT NULL
      THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_trial.ends_at - now())) / 86400.0))::int
      ELSE NULL END,
    v_trial.ends_at,
    COALESCE(v_sub.current_period_end, v_studio_end),
    public.has_role(_user_id, 'admin');
END;
$function$;