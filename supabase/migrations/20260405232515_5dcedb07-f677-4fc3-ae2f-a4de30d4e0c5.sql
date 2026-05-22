-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;

-- Recreate with path ownership check
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to upload to any path
CREATE POLICY "Admins can upload to any media path"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-media'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);