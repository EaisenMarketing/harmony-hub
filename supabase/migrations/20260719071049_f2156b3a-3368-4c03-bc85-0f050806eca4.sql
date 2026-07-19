
CREATE TABLE public.ear_training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  level text NOT NULL,
  instrument text,
  count int NOT NULL,
  correct int NOT NULL,
  accuracy int NOT NULL,
  per_type jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ear_training_sessions TO authenticated;
GRANT ALL ON public.ear_training_sessions TO service_role;
ALTER TABLE public.ear_training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ear training sessions"
  ON public.ear_training_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ear_training_sessions_user_created_idx
  ON public.ear_training_sessions(user_id, created_at DESC);
