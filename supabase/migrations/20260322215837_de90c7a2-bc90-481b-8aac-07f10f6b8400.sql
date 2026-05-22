
-- Create sql-databases storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sql-databases', 'sql-databases', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Students can read their own DB files
CREATE POLICY "Users can read own sql databases"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'sql-databases' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Students can upload/update their own DB files
CREATE POLICY "Users can upload own sql databases"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sql-databases' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Students can update their own DB files
CREATE POLICY "Users can update own sql databases"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sql-databases' AND (storage.foldername(name))[1] = auth.uid()::text);
