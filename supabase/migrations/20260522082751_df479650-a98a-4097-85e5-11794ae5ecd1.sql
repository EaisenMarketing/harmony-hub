
CREATE OR REPLACE FUNCTION public.has_pro_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.get_user_plan(_user_id) IN ('pro'::subscription_plan, 'production'::subscription_plan)
$$;

CREATE TABLE public.teacher_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  instructor_id uuid,
  instrument instrument_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'open',
  answer text,
  answered_by uuid,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own questions" ON public.teacher_questions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students create own questions" ON public.teacher_questions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own open questions" ON public.teacher_questions FOR UPDATE USING (auth.uid() = student_id AND status = 'open');
CREATE POLICY "Students delete own questions" ON public.teacher_questions FOR DELETE USING (auth.uid() = student_id);
CREATE POLICY "Instructors view targeted questions" ON public.teacher_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.instructor_profiles ip
    WHERE ip.user_id = auth.uid() AND ip.status = 'approved'
      AND (teacher_questions.instructor_id = auth.uid()
           OR (teacher_questions.instructor_id IS NULL AND ip.instrument = teacher_questions.instrument)))
);
CREATE POLICY "Instructors answer targeted questions" ON public.teacher_questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.instructor_profiles ip
    WHERE ip.user_id = auth.uid() AND ip.status = 'approved'
      AND (teacher_questions.instructor_id = auth.uid()
           OR (teacher_questions.instructor_id IS NULL AND ip.instrument = teacher_questions.instrument)))
);
CREATE POLICY "Admins manage questions" ON public.teacher_questions FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_teacher_questions_updated BEFORE UPDATE ON public.teacher_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_teacher_questions_student ON public.teacher_questions(student_id);
CREATE INDEX idx_teacher_questions_instructor ON public.teacher_questions(instructor_id);
CREATE INDEX idx_teacher_questions_instrument ON public.teacher_questions(instrument);

CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  tag text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro users view posts" ON public.community_posts FOR SELECT USING (public.has_pro_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Pro users create own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_pro_access(auth.uid()));
CREATE POLICY "Users update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins moderate posts" ON public.community_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_community_posts_updated BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_user ON public.community_posts(user_id);

CREATE TABLE public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro users view comments" ON public.community_comments FOR SELECT USING (public.has_pro_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Pro users create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_pro_access(auth.uid()));
CREATE POLICY "Users delete own comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins moderate comments" ON public.community_comments FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_community_comments_post ON public.community_comments(post_id, created_at);

CREATE TABLE public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro users view likes" ON public.community_likes FOR SELECT USING (public.has_pro_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Pro users like" ON public.community_likes FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_pro_access(auth.uid()));
CREATE POLICY "Users unlike own" ON public.community_likes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_community_likes_post ON public.community_likes(post_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('community-media', 'community-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community media public read" ON storage.objects FOR SELECT USING (bucket_id = 'community-media');
CREATE POLICY "Auth users upload community media" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'community-media' AND auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users delete own community media" ON storage.objects FOR DELETE USING (
  bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]
);
