
-- chord_detections table
CREATE TABLE public.chord_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument text NOT NULL CHECK (instrument IN ('guitar','piano')),
  detected_chord text,
  confidence numeric,
  fingers text,
  notes text[],
  suggestions text,
  image_path text NOT NULL,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chord_detections TO authenticated;
GRANT ALL ON public.chord_detections TO service_role;

ALTER TABLE public.chord_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own detections"
  ON public.chord_detections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own detections"
  ON public.chord_detections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own detections"
  ON public.chord_detections FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own detections"
  ON public.chord_detections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_chord_detections_updated_at
  BEFORE UPDATE ON public.chord_detections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for the private chord-photos bucket (each user under their own folder)
CREATE POLICY "Users read own chord photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chord-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users upload own chord photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chord-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own chord photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chord-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
