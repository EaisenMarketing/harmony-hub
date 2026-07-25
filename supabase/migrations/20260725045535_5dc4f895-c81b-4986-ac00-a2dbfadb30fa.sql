
CREATE POLICY "Public can read free-materials"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'free-materials');
