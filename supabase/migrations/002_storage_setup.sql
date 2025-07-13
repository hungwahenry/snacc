-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pics', 'profile-pics', true);

-- Enable RLS on storage.objects (if not already enabled)
DO $$ 
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage')) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policy for profile picture uploads
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pics' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for profile picture updates  
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pics' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for profile picture access
CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pics');

-- Policy for profile picture deletion
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pics' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );