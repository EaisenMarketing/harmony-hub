-- Grants + policies
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Helper: insert notification (security definer, bypasses insert restriction)
CREATE OR REPLACE FUNCTION public.push_notification(
  _user_id uuid, _type text, _title text, _body text DEFAULT NULL, _link text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF _user_id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_user_id, _type, _title, _body, _link)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

-- Mark as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(_ids uuid[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 0; END IF;
  UPDATE public.notifications
     SET read_at = now()
   WHERE user_id = auth.uid() AND read_at IS NULL
     AND (_ids IS NULL OR id = ANY(_ids));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

-- Welcome notification on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.id,
    'welcome',
    '¡Bienvenido a Acorde Live! 🎶',
    'Elige tu instrumento, activa tu prueba de 3 días y empieza con tus clases y herramientas de IA.',
    '/portal'
  );

  RETURN NEW;
END; $$;

-- Fan-out: teacher announcement -> student notifications
CREATE OR REPLACE FUNCTION public.notify_studio_announcement()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; v_studio text;
BEGIN
  SELECT studio_name INTO v_studio FROM public.teacher_accounts WHERE id = NEW.teacher_account_id;

  FOR r IN
    SELECT ts.student_user_id
      FROM public.teacher_students ts
     WHERE ts.teacher_account_id = NEW.teacher_account_id
       AND ts.status = 'active'
       AND ts.student_user_id IS NOT NULL
       AND (NEW.teacher_student_id IS NULL OR ts.id = NEW.teacher_student_id)
  LOOP
    PERFORM public.push_notification(
      r.student_user_id, 'studio_announcement',
      NEW.title,
      COALESCE(NEW.body, '') || CASE WHEN v_studio IS NOT NULL THEN E'\n— ' || v_studio ELSE '' END,
      COALESCE(NEW.link, '/mi-estudio')
    );
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_studio_announcement ON public.teacher_announcements;
CREATE TRIGGER trg_notify_studio_announcement
AFTER INSERT ON public.teacher_announcements
FOR EACH ROW EXECUTE FUNCTION public.notify_studio_announcement();

-- Fan-out: live class -> student notifications
CREATE OR REPLACE FUNCTION public.notify_studio_live_class()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; a public.teacher_accounts;
BEGIN
  SELECT * INTO a FROM public.teacher_accounts WHERE id = NEW.teacher_account_id;
  IF a.id IS NULL OR NOT a.notify_new_class THEN RETURN NEW; END IF;
  IF NOT NEW.is_published THEN RETURN NEW; END IF;

  FOR r IN
    SELECT ts.student_user_id FROM public.teacher_students ts
     WHERE ts.teacher_account_id = NEW.teacher_account_id
       AND ts.status = 'active' AND ts.student_user_id IS NOT NULL
  LOOP
    PERFORM public.push_notification(
      r.student_user_id, 'studio_live_class',
      'Nueva clase en vivo: ' || NEW.title,
      'Tu maestro programó una clase. Revisa el horario y entra desde tu estudio.',
      '/mi-estudio'
    );
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_studio_live_class ON public.teacher_live_classes;
CREATE TRIGGER trg_notify_studio_live_class
AFTER INSERT ON public.teacher_live_classes
FOR EACH ROW EXECUTE FUNCTION public.notify_studio_live_class();

-- Fan-out: assignment -> student notification
CREATE OR REPLACE FUNCTION public.notify_studio_assignment()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.teacher_accounts; v_user uuid;
BEGIN
  SELECT * INTO a FROM public.teacher_accounts WHERE id = NEW.teacher_account_id;
  IF a.id IS NULL OR NOT a.notify_new_assignment THEN RETURN NEW; END IF;

  SELECT student_user_id INTO v_user FROM public.teacher_students WHERE id = NEW.teacher_student_id;
  PERFORM public.push_notification(
    v_user, 'studio_assignment',
    'Nueva tarea: ' || NEW.title,
    COALESCE(NEW.instructions, 'Tu maestro te asignó una nueva tarea.'),
    '/mi-estudio'
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_studio_assignment ON public.teacher_assignments;
CREATE TRIGGER trg_notify_studio_assignment
AFTER INSERT ON public.teacher_assignments
FOR EACH ROW EXECUTE FUNCTION public.notify_studio_assignment();

-- Admin broadcast
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  _title text, _body text DEFAULT NULL, _link text DEFAULT NULL, _instrument text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF _title IS NULL OR length(trim(_title)) = 0 THEN
    RAISE EXCEPTION 'title_required';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT p.user_id, 'broadcast', _title, _body, _link
    FROM public.profiles p
   WHERE _instrument IS NULL OR p.primary_instrument = _instrument;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;