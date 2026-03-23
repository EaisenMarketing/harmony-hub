
CREATE TABLE public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer NOT NULL DEFAULT 0,
  instrument text NOT NULL DEFAULT 'guitar',
  notes text,
  weekly_goal_minutes integer NOT NULL DEFAULT 120,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, instrument)
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own practice sessions"
  ON public.practice_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
