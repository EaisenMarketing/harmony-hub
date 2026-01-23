-- Create storage bucket for course content (videos and thumbnails)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-content', 'course-content', true);

-- Policy: Anyone can view course content
CREATE POLICY "Course content is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-content');

-- Policy: Admins can upload course content
CREATE POLICY "Admins can upload course content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-content' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can update course content
CREATE POLICY "Admins can update course content"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-content' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can delete course content
CREATE POLICY "Admins can delete course content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-content' 
  AND public.has_role(auth.uid(), 'admin')
);