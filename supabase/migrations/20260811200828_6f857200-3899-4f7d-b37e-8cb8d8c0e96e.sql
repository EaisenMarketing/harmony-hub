
-- ============ CATÁLOGOS ============
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  ai_tool_limit integer,
  allow_practice_submissions boolean NOT NULL DEFAULT false,
  allow_teacher_feedback boolean NOT NULL DEFAULT false,
  advanced_content boolean NOT NULL DEFAULT false,
  progress_tier text NOT NULL DEFAULT 'basic',
  is_popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (true);
CREATE POLICY "plans_admin_write" ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.instruments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.instruments TO authenticated;
GRANT ALL ON public.instruments TO service_role;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instruments_public_read" ON public.instruments FOR SELECT USING (true);
CREATE POLICY "instruments_admin_write" ON public.instruments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.levels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.levels TO authenticated;
GRANT ALL ON public.levels TO service_role;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels_public_read" ON public.levels FOR SELECT USING (true);
CREATE POLICY "levels_admin_write" ON public.levels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ INSTRUMENTO DEL ALUMNO ============
CREATE TABLE public.user_instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_slug text NOT NULL,
  level_key text,
  status text NOT NULL DEFAULT 'active',
  activated_at timestamptz NOT NULL DEFAULT now(),
  paused_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX user_instruments_one_active ON public.user_instruments (user_id) WHERE status = 'active';
CREATE UNIQUE INDEX user_instruments_unique_pair ON public.user_instruments (user_id, instrument_slug);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_instruments TO authenticated;
GRANT ALL ON public.user_instruments TO service_role;
ALTER TABLE public.user_instruments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ui_own_read" ON public.user_instruments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'instructor'));
CREATE POLICY "ui_own_write" ON public.user_instruments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ui_own_update" ON public.user_instruments FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ui_admin_delete" ON public.user_instruments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.instrument_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_instrument text,
  to_instrument text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.instrument_change_history TO authenticated;
GRANT ALL ON public.instrument_change_history TO service_role;
ALTER TABLE public.instrument_change_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ich_own_read" ON public.instrument_change_history FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ TRIALS Y EVENTOS ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

CREATE TABLE public.trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_key text NOT NULL,
  instrument_slug text,
  status text NOT NULL DEFAULT 'trialing',
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  converted_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX trials_user_idx ON public.trials(user_id);
GRANT SELECT, INSERT, UPDATE ON public.trials TO authenticated;
GRANT ALL ON public.trials TO service_role;
ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trials_own_read" ON public.trials FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "trials_own_insert" ON public.trials FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "trials_own_update" ON public.trials FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  plan_key text,
  instrument_slug text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscription_events_user_idx ON public.subscription_events(user_id);
GRANT SELECT, INSERT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "se_own_read" ON public.subscription_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "se_own_insert" ON public.subscription_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'pending',
  provider_customer_id text,
  provider_method_id text,
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_own_all" ON public.payment_methods FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid());

-- ============ GRUPOS Y CLASES ============
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  instrument_slug text NOT NULL,
  level_key text NOT NULL,
  teacher_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  teacher_name text,
  weekday integer NOT NULL DEFAULT 2,
  start_time_utc time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  base_timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  capacity integer NOT NULL DEFAULT 12,
  trial_slots_limit integer NOT NULL DEFAULT 3,
  join_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.groups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groups_public_read" ON public.groups FOR SELECT USING (true);
CREATE POLICY "groups_admin_write" ON public.groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR teacher_user_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR teacher_user_id = auth.uid());

CREATE TABLE public.group_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_slug text NOT NULL,
  level_key text,
  membership_status text NOT NULL DEFAULT 'trial',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_students TO authenticated;
GRANT ALL ON public.group_students TO service_role;
ALTER TABLE public.group_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gs_read" ON public.group_students FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.teacher_user_id = auth.uid()));
CREATE POLICY "gs_insert_own" ON public.group_students FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "gs_update" ON public.group_students FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.teacher_user_id = auth.uid()))
  WITH CHECK (true);
CREATE POLICY "gs_delete" ON public.group_students FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  join_url text,
  status text NOT NULL DEFAULT 'scheduled',
  recording_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX class_sessions_group_idx ON public.class_sessions(group_id, scheduled_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_sessions TO authenticated;
GRANT SELECT ON public.class_sessions TO anon;
GRANT ALL ON public.class_sessions TO service_role;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_read" ON public.class_sessions FOR SELECT USING (true);
CREATE POLICY "cs_write" ON public.class_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.teacher_user_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.teacher_user_id = auth.uid()));

-- ============ ACORDE AI ============
CREATE TABLE public.ai_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  instrument_slugs text[] NOT NULL DEFAULT '{}'::text[],
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_tools TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ai_tools TO authenticated;
GRANT ALL ON public.ai_tools TO service_role;
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_tools_read" ON public.ai_tools FOR SELECT USING (true);
CREATE POLICY "ai_tools_admin" ON public.ai_tools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.plan_ai_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL,
  ai_tool_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_key, ai_tool_key)
);
GRANT SELECT ON public.plan_ai_tools TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.plan_ai_tools TO authenticated;
GRANT ALL ON public.plan_ai_tools TO service_role;
ALTER TABLE public.plan_ai_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pat_read" ON public.plan_ai_tools FOR SELECT USING (true);
CREATE POLICY "pat_admin" ON public.plan_ai_tools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ CLASES PRIVADAS ============
CREATE TABLE public.private_lesson_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_slug text NOT NULL,
  package_type text NOT NULL DEFAULT 'single',
  sessions_total integer NOT NULL DEFAULT 1,
  sessions_used integer NOT NULL DEFAULT 0,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.private_lesson_orders TO authenticated;
GRANT ALL ON public.private_lesson_orders TO service_role;
ALTER TABLE public.private_lesson_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plo_own" ON public.private_lesson_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "plo_insert" ON public.private_lesson_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "plo_update" ON public.private_lesson_orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (true);

-- ============ TRIGGERS updated_at ============
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_instruments_updated BEFORE UPDATE ON public.instruments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_user_instruments_updated BEFORE UPDATE ON public.user_instruments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_trials_updated BEFORE UPDATE ON public.trials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_payment_methods_updated BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_group_students_updated BEFORE UPDATE ON public.group_students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_class_sessions_updated BEFORE UPDATE ON public.class_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_tools_updated BEFORE UPDATE ON public.ai_tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_private_lesson_orders_updated BEFORE UPDATE ON public.private_lesson_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEED CATÁLOGOS ============
INSERT INTO public.plans (key,name,price_cents,ai_tool_limit,allow_practice_submissions,allow_teacher_feedback,advanced_content,progress_tier,is_popular,sort_order) VALUES
  ('essential','Esencial',2999,1,false,false,false,'basic',false,1),
  ('pro','Pro',4999,3,true,true,true,'advanced',true,2),
  ('premium','Premium',6999,NULL,true,true,true,'premium',false,3);

INSERT INTO public.instruments (slug,name,emoji,sort_order) VALUES
  ('guitar','Guitarra Acústica','🎸',1),
  ('electric_guitar','Guitarra Eléctrica','🎸',2),
  ('piano','Piano','🎹',3),
  ('bass','Bajo','🎸',4),
  ('drums','Batería','🥁',5),
  ('trumpet','Trompeta','🎺',6),
  ('production','Producción Musical','🎛️',7);

INSERT INTO public.levels (key,name,sort_order) VALUES
  ('never_played','Nunca he tocado este instrumento',1),
  ('beginner','Principiante',2),
  ('intermediate','Intermedio',3),
  ('advanced','Avanzado',4),
  ('unsure','No estoy seguro',5);

INSERT INTO public.ai_tools (key,name,description,instrument_slugs,sort_order) VALUES
  ('theory_assistant','Tutor de Teoría Musical IA','Resuelve dudas de teoría y armonía.','{}',1),
  ('chord_generator','Asistente de Acordes','Genera y visualiza acordes y progresiones.','{piano,guitar,electric_guitar,bass}',2),
  ('practice_coach','Planificador de Práctica','Rutinas de práctica personalizadas.','{}',3),
  ('practice_feedback','Entrenador de Práctica','Feedback de tu audio o video de práctica.','{}',4),
  ('ear_trainer','Entrenador de Oído','Ejercicios adaptativos de oído.','{}',5),
  ('song_analyzer','Asistente para estudiar canciones','Analiza canciones y su progresión.','{}',6),
  ('chord_photo','Detector de Acordes por Foto','Detecta acordes desde una foto.','{guitar,electric_guitar,bass}',7);

INSERT INTO public.plan_ai_tools (plan_key, ai_tool_key, enabled) VALUES
  ('essential','theory_assistant',true),
  ('pro','theory_assistant',true),('pro','chord_generator',true),('pro','practice_coach',true),
  ('premium','theory_assistant',true),('premium','chord_generator',true),('premium','practice_coach',true),
  ('premium','practice_feedback',true),('premium','ear_trainer',true),('premium','song_analyzer',true),('premium','chord_photo',true);

-- ============ MIGRACIÓN DE ALUMNOS ACTUALES ============
INSERT INTO public.user_instruments (user_id, instrument_slug, status)
SELECT p.user_id, p.primary_instrument, 'active'
FROM public.profiles p
WHERE p.primary_instrument IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============ FUNCIONES DE ACCESO ============
CREATE OR REPLACE FUNCTION public.active_instrument(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT instrument_slug FROM public.user_instruments
  WHERE user_id = _user_id AND status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_entitlement(_user_id uuid)
RETURNS TABLE(
  plan_key text, status text, instrument_slug text, level_key text,
  ai_tool_limit integer, allow_practice_submissions boolean, allow_teacher_feedback boolean,
  advanced_content boolean, trial_days_left integer, trial_ends_at timestamptz,
  current_period_end timestamptz, is_admin boolean
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_trial public.trials;
  v_sub public.subscriptions;
  v_plan public.plans;
  v_plan_key text;
  v_status text := 'inactive';
  v_ui public.user_instruments;
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

  IF v_plan_key IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.plans WHERE key = v_plan_key LIMIT 1;
  END IF;

  SELECT * INTO v_ui FROM public.user_instruments
    WHERE user_id = _user_id AND status = 'active' LIMIT 1;

  RETURN QUERY SELECT
    v_plan_key,
    v_status,
    v_ui.instrument_slug,
    v_ui.level_key,
    CASE WHEN v_status = 'trialing' THEN 1 ELSE v_plan.ai_tool_limit END,
    COALESCE(v_plan.allow_practice_submissions, false) AND v_status <> 'trialing',
    COALESCE(v_plan.allow_teacher_feedback, false) AND v_status <> 'trialing',
    COALESCE(v_plan.advanced_content, false) AND v_status <> 'trialing',
    CASE WHEN v_trial.id IS NOT NULL
      THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_trial.ends_at - now())) / 86400.0))::int
      ELSE NULL END,
    v_trial.ends_at,
    v_sub.current_period_end,
    public.has_role(_user_id, 'admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_instrument(_user_id uuid, _instrument text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin')
    OR EXISTS (SELECT 1 FROM public.user_instruments
               WHERE user_id = _user_id AND status = 'active' AND instrument_slug = _instrument);
$$;

CREATE OR REPLACE FUNCTION public.can_use_ai_tool(_user_id uuid, _tool_key text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE e record; t public.ai_tools;
BEGIN
  IF public.has_role(_user_id,'admin') THEN RETURN true; END IF;
  SELECT * INTO t FROM public.ai_tools WHERE key = _tool_key AND is_active LIMIT 1;
  IF t.id IS NULL THEN RETURN false; END IF;
  SELECT * INTO e FROM public.current_entitlement(_user_id);
  IF e.plan_key IS NULL OR e.status = 'inactive' THEN RETURN false; END IF;
  IF e.instrument_slug IS NULL THEN RETURN false; END IF;
  IF array_length(t.instrument_slugs,1) IS NOT NULL
     AND NOT (e.instrument_slug = ANY(t.instrument_slugs)) THEN RETURN false; END IF;
  IF e.status = 'trialing' THEN RETURN _tool_key = 'theory_assistant'; END IF;
  RETURN EXISTS (SELECT 1 FROM public.plan_ai_tools
                 WHERE plan_key = e.plan_key AND ai_tool_key = _tool_key AND enabled);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_start_trial(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT COALESCE((SELECT trial_used FROM public.profiles WHERE user_id = _user_id LIMIT 1), false)
     AND NOT EXISTS (SELECT 1 FROM public.trials WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.start_trial(_plan_key text, _instrument text DEFAULT NULL)
RETURNS TABLE(ok boolean, message text, trial_ends_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_end timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN QUERY SELECT false,'not_authenticated',NULL::timestamptz; RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE key = _plan_key AND is_active) THEN
    RETURN QUERY SELECT false,'invalid_plan',NULL::timestamptz; RETURN; END IF;
  IF NOT public.can_start_trial(auth.uid()) THEN
    RETURN QUERY SELECT false,'trial_already_used',NULL::timestamptz; RETURN; END IF;

  v_end := now() + interval '3 days';
  INSERT INTO public.trials (user_id, plan_key, instrument_slug, ends_at)
    VALUES (auth.uid(), _plan_key, _instrument, v_end);
  UPDATE public.profiles SET trial_used = true WHERE user_id = auth.uid();
  INSERT INTO public.subscription_events (user_id, event_type, plan_key, instrument_slug)
    VALUES (auth.uid(),'trial_started',_plan_key,_instrument);
  RETURN QUERY SELECT true,'trial_started',v_end;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_active_instrument(_instrument text, _level text DEFAULT NULL)
RETURNS TABLE(ok boolean, message text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current public.user_instruments; v_last timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN QUERY SELECT false,'not_authenticated'; RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.instruments WHERE slug = _instrument AND is_active) THEN
    RETURN QUERY SELECT false,'invalid_instrument'; RETURN; END IF;

  SELECT * INTO v_current FROM public.user_instruments
    WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;

  IF v_current.id IS NOT NULL AND v_current.instrument_slug = _instrument THEN
    UPDATE public.user_instruments SET level_key = COALESCE(_level, level_key) WHERE id = v_current.id;
    RETURN QUERY SELECT true,'unchanged'; RETURN;
  END IF;

  IF v_current.id IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    SELECT max(changed_at) INTO v_last FROM public.instrument_change_history WHERE user_id = auth.uid();
    IF v_last IS NOT NULL AND v_last > now() - interval '30 days' THEN
      RETURN QUERY SELECT false,'change_cooldown'; RETURN;
    END IF;
    UPDATE public.user_instruments
      SET status = 'paused', paused_at = now() WHERE id = v_current.id;
    INSERT INTO public.instrument_change_history (user_id, from_instrument, to_instrument)
      VALUES (auth.uid(), v_current.instrument_slug, _instrument);
  END IF;

  INSERT INTO public.user_instruments (user_id, instrument_slug, level_key, status, activated_at)
  VALUES (auth.uid(), _instrument, _level, 'active', now())
  ON CONFLICT (user_id, instrument_slug)
  DO UPDATE SET status = 'active', paused_at = NULL, activated_at = now(),
                level_key = COALESCE(EXCLUDED.level_key, public.user_instruments.level_key);

  UPDATE public.profiles SET primary_instrument = _instrument WHERE user_id = auth.uid();
  RETURN QUERY SELECT true,'ok';
END;
$$;

CREATE OR REPLACE FUNCTION public.group_seat_counts(_group_id uuid)
RETURNS TABLE(total integer, trials integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int,
         COUNT(*) FILTER (WHERE membership_status = 'trial')::int
  FROM public.group_students WHERE group_id = _group_id AND left_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.join_group(_group_id uuid)
RETURNS TABLE(ok boolean, message text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.groups; e record; c record;
BEGIN
  IF auth.uid() IS NULL THEN RETURN QUERY SELECT false,'not_authenticated'; RETURN; END IF;
  SELECT * INTO g FROM public.groups WHERE id = _group_id AND is_active LIMIT 1;
  IF g.id IS NULL THEN RETURN QUERY SELECT false,'invalid_group'; RETURN; END IF;
  SELECT * INTO e FROM public.current_entitlement(auth.uid());
  IF e.instrument_slug IS NULL OR e.instrument_slug <> g.instrument_slug THEN
    RETURN QUERY SELECT false,'instrument_mismatch'; RETURN; END IF;
  SELECT * INTO c FROM public.group_seat_counts(_group_id);
  IF c.total >= g.capacity THEN RETURN QUERY SELECT false,'group_full'; RETURN; END IF;
  IF e.status = 'trialing' AND c.trials >= g.trial_slots_limit THEN
    RETURN QUERY SELECT false,'trial_slots_full'; RETURN; END IF;

  INSERT INTO public.group_students (group_id,user_id,instrument_slug,level_key,membership_status)
  VALUES (_group_id, auth.uid(), g.instrument_slug, e.level_key,
          CASE WHEN e.status = 'trialing' THEN 'trial' ELSE 'active' END)
  ON CONFLICT (group_id, user_id) DO UPDATE
    SET left_at = NULL, membership_status = EXCLUDED.membership_status;
  RETURN QUERY SELECT true,'joined';
END;
$$;

GRANT EXECUTE ON FUNCTION public.active_instrument(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_entitlement(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_instrument(uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_use_ai_tool(uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_start_trial(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_trial(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_active_instrument(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.group_seat_counts(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_group(uuid) TO authenticated;
