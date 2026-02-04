-- Create avatars bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow public read access
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow anyone to upload avatars
CREATE POLICY "Anyone can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Allow update of avatars
CREATE POLICY "Anyone can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- Allow delete of avatars
CREATE POLICY "Anyone can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');