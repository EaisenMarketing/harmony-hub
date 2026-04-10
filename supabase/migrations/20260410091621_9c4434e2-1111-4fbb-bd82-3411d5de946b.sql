CREATE TABLE public.custom_progressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  chords text[] NOT NULL DEFAULT '{}',
  key text,
  description text,
  instrument text NOT NULL DEFAULT 'guitar',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_progressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom progressions"
ON public.custom_progressions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_custom_progressions_updated_at
BEFORE UPDATE ON public.custom_progressions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();