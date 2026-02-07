-- Create table to store saved song analyses for users
CREATE TABLE public.saved_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  youtube_url TEXT NOT NULL,
  video_id TEXT,
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL,
  key TEXT,
  tempo TEXT,
  time_signature TEXT,
  chords TEXT[] DEFAULT '{}',
  structure JSONB DEFAULT '[]',
  progression JSONB DEFAULT '{}',
  difficulty TEXT,
  tips TEXT[] DEFAULT '{}',
  similar_songs TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_songs ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved songs
CREATE POLICY "Users can view own saved songs"
  ON public.saved_songs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved songs
CREATE POLICY "Users can insert own saved songs"
  ON public.saved_songs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved songs
CREATE POLICY "Users can delete own saved songs"
  ON public.saved_songs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_saved_songs_updated_at
  BEFORE UPDATE ON public.saved_songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();