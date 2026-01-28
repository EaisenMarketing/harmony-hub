-- Create lesson_notes table for student notes and bookmarks
CREATE TABLE public.lesson_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_bookmark BOOLEAN NOT NULL DEFAULT false,
  timestamp_seconds INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_lesson_notes_user_lesson ON public.lesson_notes(user_id, lesson_id);
CREATE INDEX idx_lesson_notes_bookmark ON public.lesson_notes(user_id, is_bookmark) WHERE is_bookmark = true;

-- Enable Row Level Security
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notes
CREATE POLICY "Users can manage own notes"
ON public.lesson_notes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all notes for analytics
CREATE POLICY "Admins can view all notes"
ON public.lesson_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_lesson_notes_updated_at
BEFORE UPDATE ON public.lesson_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();