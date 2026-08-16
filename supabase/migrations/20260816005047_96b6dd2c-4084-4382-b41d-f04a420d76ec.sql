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
  SELECT * INTO v_trial FROM public.trials
    WHERE user_id = _user_id AND status = 'trialing' AND ends_at > now()
    ORDER BY started_at DESC LIMIT 1;

  SELECT * INTO v_sub FROM public.subscriptions
    WHERE user_id = _user_id AND status IN ('active','trialing','past_due')
    ORDER BY created_at DESC LIMIT 1;

  IF v_trial.id IS NOT NULL THEN
    v_plan_key := v_trial.plan_key;
    v_status := 'trialing';
  ELSIF v_sub.id IS NOT NULL THEN
    v_plan_key := v_sub.plan::text;
    v_status := 'active';
  END IF;

  -- Acceso vía estudio de maestro (maestro dueño o alumno de un estudio pagado)
  IF v_plan_key IS NULL THEN
    SELECT ta.plan::text AS tplan,
           COALESCE(ta.primary_instrument, NULL) AS owner_instrument,
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
      v_plan_key := CASE v_studio.tplan
                      WHEN 'starter' THEN 'essential'
                      WHEN 'pro' THEN 'pro'
                      ELSE 'premium' END;
      v_status := 'active';
      v_studio_instrument := COALESCE(v_studio.student_instrument, v_studio.owner_instrument);
      v_studio_end := v_studio.ends;
    END IF;
  END IF;

  IF v_plan_key IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.plans WHERE key = v_plan_key LIMIT 1;
  END IF;

  SELECT * INTO v_ui FROM public.user_instruments
    WHERE user_id = _user_id AND status = 'active' LIMIT 1;

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

-- Cupos y estado del estudio al agregar/reactivar alumnos
CREATE OR REPLACE FUNCTION public.enforce_studio_seats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE a public.teacher_accounts; v_used int;
BEGIN
  SELECT * INTO a FROM public.teacher_accounts WHERE id = NEW.teacher_account_id;
  IF a.id IS NULL THEN RAISE EXCEPTION 'studio_not_found'; END IF;

  IF a.status NOT IN ('trial','active') THEN
    RAISE EXCEPTION 'studio_inactive';
  END IF;

  IF NEW.status <> 'inactive'
     AND (TG_OP = 'INSERT' OR OLD.status = 'inactive') THEN
    SELECT COUNT(*)::int INTO v_used FROM public.teacher_students
      WHERE teacher_account_id = NEW.teacher_account_id
        AND status <> 'inactive' AND id <> NEW.id;
    IF v_used >= a.seat_limit THEN
      RAISE EXCEPTION 'seat_limit_reached';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_studio_seats ON public.teacher_students;
CREATE TRIGGER trg_enforce_studio_seats
BEFORE INSERT OR UPDATE OF status, teacher_account_id ON public.teacher_students
FOR EACH ROW EXECUTE FUNCTION public.enforce_studio_seats();

-- Estado de suscripción del estudio para el maestro (lectura)
CREATE OR REPLACE FUNCTION public.studio_status(_account_id uuid)
RETURNS TABLE(status text, plan text, seat_limit integer, seats_used integer, days_left integer, is_active boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ta.status::text,
         ta.plan::text,
         ta.seat_limit,
         public.teacher_seats_used(ta.id),
         CASE
           WHEN ta.status = 'trial' THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (ta.trial_ends_at - now()))/86400.0))::int
           WHEN ta.subscription_expires_at IS NOT NULL THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (ta.subscription_expires_at - now()))/86400.0))::int
           ELSE NULL END,
         (ta.status = 'active' AND (ta.subscription_expires_at IS NULL OR ta.subscription_expires_at > now()))
           OR (ta.status = 'trial' AND ta.trial_ends_at > now())
  FROM public.teacher_accounts ta
  WHERE ta.id = _account_id
    AND (ta.owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
$function$;