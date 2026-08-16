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

  IF v_plan_key IS NULL THEN
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

CREATE OR REPLACE FUNCTION public.can_use_ai_tool(_user_id uuid, _tool_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE e record; t public.ai_tools;
BEGIN
  IF public.has_role(_user_id,'admin') THEN RETURN true; END IF;
  SELECT a.* INTO t FROM public.ai_tools a WHERE a.key = _tool_key AND a.is_active LIMIT 1;
  IF t.id IS NULL THEN RETURN false; END IF;
  SELECT * INTO e FROM public.current_entitlement(_user_id);
  IF e.plan_key IS NULL OR e.status = 'inactive' THEN RETURN false; END IF;
  IF e.instrument_slug IS NULL THEN RETURN false; END IF;
  IF array_length(t.instrument_slugs,1) IS NOT NULL
     AND NOT (e.instrument_slug = ANY(t.instrument_slugs)) THEN RETURN false; END IF;
  IF e.status = 'trialing' THEN RETURN _tool_key = 'theory_assistant'; END IF;
  RETURN EXISTS (SELECT 1 FROM public.plan_ai_tools pt
                 WHERE pt.plan_key = e.plan_key AND pt.ai_tool_key = _tool_key AND pt.enabled);
END;
$function$;