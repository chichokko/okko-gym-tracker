-- Crear buckets (públicos) con nombres en español
INSERT INTO storage.buckets (id, name, public) VALUES ('Avatares', 'Avatares', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('Logos', 'Logos', true);

-- Políticas para Avatares
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'Avatares');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'Avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'Avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'Avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Políticas para Logos
CREATE POLICY "Logo images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'Logos');

CREATE POLICY "Users can upload their own logo"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'Logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own logo"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'Logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own logo"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'Logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
