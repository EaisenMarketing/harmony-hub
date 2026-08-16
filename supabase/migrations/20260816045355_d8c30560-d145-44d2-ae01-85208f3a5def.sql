CREATE TABLE public.scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Partitura sin título',
  instrument text NOT NULL DEFAULT 'guitar',
  key_signature text NOT NULL DEFAULT 'C',
  time_signature text NOT NULL DEFAULT '4/4',
  tempo integer NOT NULL DEFAULT 90,
  level text,
  description text,
  content jsonb NOT NULL DEFAULT '{"measures":[]}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  share_code text NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX scores_share_code_key ON public.scores(share_code);
CREATE INDEX scores_user_id_idx ON public.scores(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scores TO authenticated;
GRANT SELECT ON public.scores TO anon;
GRANT ALL ON public.scores TO service_role;

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own scores"
  ON public.scores FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public scores are viewable by anyone"
  ON public.scores FOR SELECT TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Admins can view all scores"
  ON public.scores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.score_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id uuid NOT NULL REFERENCES public.scores(id) ON DELETE CASCADE,
  teacher_account_id uuid NOT NULL REFERENCES public.teacher_accounts(id) ON DELETE CASCADE,
  teacher_student_id uuid NOT NULL REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  student_user_id uuid,
  instructions text,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  student_notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX score_assignments_student_idx ON public.score_assignments(student_user_id);
CREATE INDEX score_assignments_account_idx ON public.score_assignments(teacher_account_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_assignments TO authenticated;
GRANT ALL ON public.score_assignments TO service_role;

ALTER TABLE public.score_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage assignments of their studio"
  ON public.score_assignments FOR ALL TO authenticated
  USING (public.owns_teacher_account(teacher_account_id))
  WITH CHECK (public.owns_teacher_account(teacher_account_id));

CREATE POLICY "Students view their score assignments"
  ON public.score_assignments FOR SELECT TO authenticated
  USING (auth.uid() = student_user_id);

CREATE POLICY "Students update their score assignments"
  ON public.score_assignments FOR UPDATE TO authenticated
  USING (auth.uid() = student_user_id)
  WITH CHECK (auth.uid() = student_user_id);

CREATE TRIGGER update_score_assignments_updated_at
  BEFORE UPDATE ON public.score_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Assigned students can view the score"
  ON public.scores FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.score_assignments sa
    WHERE sa.score_id = scores.id AND sa.student_user_id = auth.uid()
  ));