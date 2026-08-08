ALTER TABLE public.teacher_accounts
  ADD COLUMN IF NOT EXISTS zoom_room_url TEXT,
  ADD COLUMN IF NOT EXISTS zoom_email TEXT,
  ADD COLUMN IF NOT EXISTS notify_new_class BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_assignment BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_class_reminder BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE public.teacher_live_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_account_id UUID NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instrument TEXT,
  level TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  join_url TEXT,
  meeting_id TEXT,
  passcode TEXT,
  recording_url TEXT,
  max_attendees INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_live_classes TO authenticated;
GRANT ALL ON public.teacher_live_classes TO service_role;
ALTER TABLE public.teacher_live_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their live classes"
  ON public.teacher_live_classes FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id))
  WITH CHECK (public.owns_teacher_account(teacher_account_id));

CREATE POLICY "Students view published live classes of their studio"
  ON public.teacher_live_classes FOR SELECT TO authenticated
  USING (is_published AND public.is_student_of_account(teacher_account_id));

CREATE TRIGGER trg_teacher_live_classes_updated
  BEFORE UPDATE ON public.teacher_live_classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.teacher_class_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_account_id UUID NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  live_class_id UUID NOT NULL REFERENCES public.teacher_live_classes(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT false,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (live_class_id, student_user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_class_registrations TO authenticated;
GRANT ALL ON public.teacher_class_registrations TO service_role;
ALTER TABLE public.teacher_class_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage registrations of their studio"
  ON public.teacher_class_registrations FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id))
  WITH CHECK (public.owns_teacher_account(teacher_account_id));

CREATE POLICY "Students view their own registrations"
  ON public.teacher_class_registrations FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());

CREATE POLICY "Students register themselves"
  ON public.teacher_class_registrations FOR INSERT TO authenticated
  WITH CHECK (student_user_id = auth.uid() AND public.is_student_of_account(teacher_account_id));

CREATE POLICY "Students update their own registration"
  ON public.teacher_class_registrations FOR UPDATE TO authenticated
  USING (student_user_id = auth.uid())
  WITH CHECK (student_user_id = auth.uid());

CREATE POLICY "Students cancel their own registration"
  ON public.teacher_class_registrations FOR DELETE TO authenticated
  USING (student_user_id = auth.uid());

CREATE TABLE public.teacher_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_account_id UUID NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  teacher_student_id UUID REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  audience TEXT NOT NULL DEFAULT 'all',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  send_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_announcements TO authenticated;
GRANT ALL ON public.teacher_announcements TO service_role;
ALTER TABLE public.teacher_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their announcements"
  ON public.teacher_announcements FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id))
  WITH CHECK (public.owns_teacher_account(teacher_account_id));

CREATE POLICY "Students view announcements for them"
  ON public.teacher_announcements FOR SELECT TO authenticated
  USING (
    public.is_student_of_account(teacher_account_id)
    AND (
      audience = 'all'
      OR teacher_student_id IN (
        SELECT id FROM public.teacher_students WHERE student_user_id = auth.uid()
      )
    )
  );

CREATE TRIGGER trg_teacher_announcements_updated
  BEFORE UPDATE ON public.teacher_announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_teacher_live_classes_account_time ON public.teacher_live_classes(teacher_account_id, scheduled_at);
CREATE INDEX idx_teacher_announcements_account ON public.teacher_announcements(teacher_account_id, created_at DESC);