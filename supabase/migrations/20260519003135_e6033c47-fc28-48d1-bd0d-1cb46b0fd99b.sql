CREATE TABLE public.song_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  youtube_url TEXT,
  corrected_analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

ALTER TABLE public.song_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own corrections"
ON public.song_corrections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own corrections"
ON public.song_corrections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own corrections"
ON public.song_corrections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own corrections"
ON public.song_corrections FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_song_corrections_updated_at
BEFORE UPDATE ON public.song_corrections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_song_corrections_video ON public.song_corrections(video_id);