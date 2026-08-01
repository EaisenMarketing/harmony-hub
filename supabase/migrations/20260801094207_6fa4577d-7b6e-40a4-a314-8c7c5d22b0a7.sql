-- =========================================================
-- Capa B2B: cuentas de maestros (aislada del esquema actual)
-- =========================================================

CREATE TYPE public.teacher_plan AS ENUM ('starter', 'pro', 'academy');
CREATE TYPE public.teacher_account_status AS ENUM ('trial', 'active', 'suspended', 'canceled');
CREATE TYPE public.teacher_student_status AS ENUM ('invited', 'active', 'inactive');

-- ---------- teacher_accounts ----------
CREATE TABLE public.teacher_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_name TEXT NOT NULL,
  contact_email TEXT,
  phone TEXT,
  primary_instrument TEXT,
  bio TEXT,
  plan public.teacher_plan NOT NULL DEFAULT 'starter',
  seat_limit INTEGER NOT NULL DEFAULT 10,
  status public.teacher_account_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_accounts TO authenticated;
GRANT SELECT ON public.teacher_accounts TO anon;
GRANT ALL ON public.teacher_accounts TO service_role;
ALTER TABLE public.teacher_accounts ENABLE ROW LEVEL SECURITY;

-- ---------- helpers (security definer, evitan recursión) ----------
CREATE OR REPLACE FUNCTION public.my_teacher_account_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.teacher_accounts WHERE owner_user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.owns_teacher_account(_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.teacher_accounts
  WHERE id = _account_id AND owner_user_id = auth.uid()
) $$;

-- ---------- teacher_students ----------
CREATE TABLE public.teacher_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_account_id UUID NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  instrument TEXT,
  level TEXT,
  notes TEXT,
  status public.teacher_student_status NOT NULL DEFAULT 'invited',
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (teacher_account_id, email)
);

CREATE INDEX idx_teacher_students_account ON public.teacher_students(teacher_account_id);
CREATE INDEX idx_teacher_students_user ON public.teacher_students(student_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_students TO authenticated;
GRANT ALL ON public.teacher_students TO service_role;
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_studio_account_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT teacher_account_id FROM public.teacher_students
  WHERE student_user_id = auth.uid() AND status = 'active'
  ORDER BY joined_at DESC NULLS LAST LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.is_student_of_account(_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.teacher_students
  WHERE teacher_account_id = _account_id
    AND student_user_id = auth.uid()
    AND status = 'active'
) $$;

CREATE OR REPLACE FUNCTION public.teacher_seats_used(_account_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COUNT(*)::int FROM public.teacher_students
  WHERE teacher_account_id = _account_id AND status <> 'inactive' $$;

-- ---------- políticas teacher_accounts ----------
CREATE POLICY "Owners manage their teacher account"
  ON public.teacher_accounts FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Students can view their studio"
  ON public.teacher_accounts FOR SELECT TO authenticated
  USING (public.is_student_of_account(id));

CREATE POLICY "Admins manage all teacher accounts"
  ON public.teacher_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read active studios for invites"
  ON public.teacher_accounts FOR SELECT TO anon, authenticated
  USING (status IN ('trial', 'active'));

-- ---------- políticas teacher_students ----------
CREATE POLICY "Teachers manage their students"
  ON public.teacher_students FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id))
  WITH CHECK (public.owns_teacher_account(teacher_account_id));

CREATE POLICY "Students view their own membership"
  ON public.teacher_students FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());

CREATE POLICY "Students can claim their invite"
  ON public.teacher_students FOR UPDATE TO authenticated
  USING (student_user_id IS NULL OR student_user_id = auth.uid())
  WITH CHECK (student_user_id = auth.uid());

CREATE POLICY "Admins manage all teacher students"
  ON public.teacher_students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- teacher_courses ----------
CREATE TABLE public.teacher_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_account_id UUID NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instrument TEXT,
  level TEXT NOT NULL DEFAULT 'beginner',
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_teacher_courses_account ON public.teacher_courses(teacher_account_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_courses TO authenticated;
GRANT ALL ON public.teacher_courses TO service_role;
ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their courses"
  ON public.teacher_courses FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id))
  WITH CHECK (public.owns_teacher_account(teacher_account_id));

CREATE POLICY "Studio students view published courses"
  ON public.teacher_courses FOR SELECT TO authenticated
  USING (is_published AND public.is_student_of_account(teacher_account_id));

CREATE POLICY "Admins manage all teacher courses"
  ON public.teacher_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- teacher_lessons ----------
CREATE TABLE public.teacher_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_course_id UUID NOT NULL REFERENCES public.teacher_courses(id) ON DELETE CASCADE,
  teacher_account_id UUID NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  attachment_url TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_teacher_lessons_course ON public.teacher_lessons(teacher_course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_lessons TO authenticated;
GRANT ALL ON public.teacher_lessons TO service_role;
ALTER TABLE public.teacher_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their lessons"
  ON public.teacher_lessons FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id))
  WITH CHECK (public.owns_teacher_account(teacher_account_id));

CREATE POLICY "Studio students view lessons of published courses"
  ON public.teacher_lessons FOR SELECT TO authenticated
  USING (
    public.is_student_of_account(teacher_account_id)
    AND EXISTS (
      SELECT 1 FROM public.teacher_courses c
      WHERE c.id = teacher_course_id AND c.is_published
    )
  );

CREATE POLICY "Admins manage all teacher lessons"
  ON public.teacher_lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- teacher_lesson_progress ----------
CREATE TABLE public.teacher_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_account_id UUID NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  teacher_lesson_id UUID NOT NULL REFERENCES public.teacher_lessons(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (teacher_lesson_id, student_user_id)
);

CREATE INDEX idx_tlp_account ON public.teacher_lesson_progress(teacher_account_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_lesson_progress TO authenticated;
GRANT ALL ON public.teacher_lesson_progress TO service_role;
ALTER TABLE public.teacher_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own studio progress"
  ON public.teacher_lesson_progress FOR ALL TO authenticated
  USING (student_user_id = auth.uid())
  WITH CHECK (student_user_id = auth.uid() AND public.is_student_of_account(teacher_account_id));

CREATE POLICY "Teachers view their students progress"
  ON public.teacher_lesson_progress FOR SELECT TO authenticated
  USING (public.owns_teacher_account(teacher_account_id));

CREATE POLICY "Admins manage all studio progress"
  ON public.teacher_lesson_progress FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- teacher_assignments ----------
CREATE TABLE public.teacher_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_account_id UUID NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  teacher_student_id UUID NOT NULL REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  tool_key TEXT,
  due_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  student_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_teacher_assignments_account ON public.teacher_assignments(teacher_account_id);
CREATE INDEX idx_teacher_assignments_student ON public.teacher_assignments(teacher_student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their assignments"
  ON public.teacher_assignments FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id))
  WITH CHECK (public.owns_teacher_account(teacher_account_id));

CREATE POLICY "Students view their assignments"
  ON public.teacher_assignments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teacher_students s
    WHERE s.id = teacher_student_id AND s.student_user_id = auth.uid()
  ));

CREATE POLICY "Students update their assignment status"
  ON public.teacher_assignments FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teacher_students s
    WHERE s.id = teacher_student_id AND s.student_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.teacher_students s
    WHERE s.id = teacher_student_id AND s.student_user_id = auth.uid()
  ));

CREATE POLICY "Admins manage all assignments"
  ON public.teacher_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- triggers updated_at ----------
CREATE TRIGGER trg_teacher_accounts_updated BEFORE UPDATE ON public.teacher_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_teacher_students_updated BEFORE UPDATE ON public.teacher_students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_teacher_courses_updated BEFORE UPDATE ON public.teacher_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_teacher_lessons_updated BEFORE UPDATE ON public.teacher_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_teacher_lesson_progress_updated BEFORE UPDATE ON public.teacher_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_teacher_assignments_updated BEFORE UPDATE ON public.teacher_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();