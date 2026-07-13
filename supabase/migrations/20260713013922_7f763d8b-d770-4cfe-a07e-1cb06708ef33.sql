
-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- ENROLLMENTS (compra individual o via plan)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'plan',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_payment_intent_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
GRANT SELECT ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own enrollments" ON public.enrollments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all enrollments" ON public.enrollments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Instructors view enrollments in their courses" ON public.enrollments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = enrollments.course_id AND c.instructor_id = auth.uid())
  );
CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- LESSON PROGRESS (detalle de reproducción)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  watch_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lesson progress" ON public.lesson_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all lesson progress" ON public.lesson_progress
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- ASSIGNMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  due_days INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assignments TO authenticated, anon;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view assignments" ON public.assignments
  FOR SELECT USING (true);
CREATE POLICY "Instructors manage own course assignments" ON public.assignments
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = assignments.course_id AND c.instructor_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = assignments.course_id AND c.instructor_id = auth.uid())
  );
CREATE POLICY "Admins manage all assignments" ON public.assignments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- ASSIGNMENT SUBMISSIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  grade INTEGER,
  feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.assignment_submissions TO authenticated;
GRANT ALL ON public.assignment_submissions TO service_role;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own submissions" ON public.assignment_submissions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Instructors view submissions in their courses" ON public.assignment_submissions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.courses c ON c.id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid()
    )
  );
CREATE POLICY "Instructors grade submissions in their courses" ON public.assignment_submissions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.courses c ON c.id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid()
    )
  );
CREATE POLICY "Admins manage all submissions" ON public.assignment_submissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_assignment_submissions_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- CERTIFICATES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  verification_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
GRANT SELECT ON public.certificates TO anon, authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can verify certificate by code" ON public.certificates
  FOR SELECT USING (true);
CREATE POLICY "Admins manage certificates" ON public.certificates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- has_course_access helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- admin
    public.has_role(_user_id, 'admin')
    -- own course (instructor)
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = _course_id AND c.instructor_id = _user_id)
    -- active enrollment
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = _user_id AND e.course_id = _course_id
        AND e.status = 'active'
        AND (e.expires_at IS NULL OR e.expires_at > now())
    )
    -- plan covers required_plan
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = _course_id
        AND CASE
          WHEN c.required_plan = 'basic' THEN true
          WHEN c.required_plan = 'standard' THEN public.get_user_plan(_user_id) IN ('standard'::public.subscription_plan, 'pro'::public.subscription_plan, 'production'::public.subscription_plan)
          WHEN c.required_plan = 'pro' THEN public.get_user_plan(_user_id) IN ('pro'::public.subscription_plan, 'production'::public.subscription_plan)
          WHEN c.required_plan = 'production' THEN public.get_user_plan(_user_id) = 'production'::public.subscription_plan
          ELSE false
        END
    );
$$;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) TO authenticated, anon;
