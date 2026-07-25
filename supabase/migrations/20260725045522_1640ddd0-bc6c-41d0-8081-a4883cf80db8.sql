
CREATE POLICY "Admins can manage free-materials objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'free-materials' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'free-materials' AND public.has_role(auth.uid(), 'admin'));
