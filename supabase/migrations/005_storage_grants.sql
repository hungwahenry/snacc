-- Additional storage-specific grants and setup

-- Ensure the storage schema exists and has proper grants
DO $$ 
BEGIN
  -- Grant basic schema usage
  GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
  
  -- Grant table access for storage operations
  GRANT ALL ON storage.objects TO postgres, service_role;
  GRANT SELECT ON storage.objects TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
  
  GRANT ALL ON storage.buckets TO postgres, service_role;
  GRANT SELECT ON storage.buckets TO anon, authenticated;
  
  -- Grant sequence access
  GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres, service_role;
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA storage TO authenticated;
  
EXCEPTION
  WHEN insufficient_privilege THEN
    -- If we don't have permission to grant these, skip silently
    NULL;
END $$;

-- Grant access to essential storage functions
DO $$
BEGIN
  -- Storage helper functions
  GRANT EXECUTE ON FUNCTION storage.foldername(text) TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION storage.filename(text) TO anon, authenticated;  
  GRANT EXECUTE ON FUNCTION storage.extension(text) TO anon, authenticated;
  
EXCEPTION
  WHEN undefined_function THEN
    -- Function doesn't exist, skip
    NULL;
  WHEN insufficient_privilege THEN
    -- Don't have permission, skip
    NULL;
END $$;

-- Create indexes for better storage performance if they don't exist
DO $$
BEGIN
  -- Index on bucket_id for faster queries
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'objects' AND schemaname = 'storage' AND indexname = 'objects_bucket_id_idx') THEN
    CREATE INDEX objects_bucket_id_idx ON storage.objects(bucket_id);
  END IF;
  
  -- Index on owner for faster RLS checks
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'objects' AND schemaname = 'storage' AND indexname = 'objects_owner_idx') THEN
    CREATE INDEX objects_owner_idx ON storage.objects(owner);
  END IF;
  
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Can't create indexes, skip
    NULL;
END $$;

-- Ensure bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pics',
  'profile-pics', 
  true, 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create a more comprehensive storage policy for profile pictures
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Recreate policies with better error handling
CREATE POLICY "Profile pics: Users can upload to their own folder" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pics' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Profile pics: Users can update their own files" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'profile-pics' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Profile pics: Public read access" ON storage.objects
  FOR SELECT 
  TO anon, authenticated
  USING (bucket_id = 'profile-pics');

CREATE POLICY "Profile pics: Users can delete their own files" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'profile-pics' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.uid() IS NOT NULL
  );

-- Add a helper function to generate profile picture paths
CREATE OR REPLACE FUNCTION generate_profile_pic_path(user_id UUID, file_extension TEXT DEFAULT 'jpg')
RETURNS TEXT AS $$
BEGIN
  RETURN user_id::TEXT || '/profile.' || file_extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the helper function
GRANT EXECUTE ON FUNCTION generate_profile_pic_path(UUID, TEXT) TO authenticated;