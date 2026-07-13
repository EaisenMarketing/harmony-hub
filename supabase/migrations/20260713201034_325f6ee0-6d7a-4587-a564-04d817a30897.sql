
ALTER TABLE public.contact_leads
  ADD COLUMN IF NOT EXISTS attachment_paths text[] NOT NULL DEFAULT '{}';

-- Bucket is created via storage_create_bucket tool call; policies below.
CREATE POLICY "Users upload own support attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own support attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Users delete own support attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
