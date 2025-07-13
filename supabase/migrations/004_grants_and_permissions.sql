-- Grant necessary permissions for storage and RLS policies to work properly

-- Grant usage on auth schema to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Grant access to auth.uid() function
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon;

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;

-- Grant access to storage helper functions
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO authenticated;
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO anon;
GRANT EXECUTE ON FUNCTION storage.filename(text) TO authenticated;
GRANT EXECUTE ON FUNCTION storage.filename(text) TO anon;
GRANT EXECUTE ON FUNCTION storage.extension(text) TO authenticated;
GRANT EXECUTE ON FUNCTION storage.extension(text) TO anon;

-- Grant access to storage.objects table for RLS policies
GRANT SELECT ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT INSERT ON storage.objects TO authenticated;
GRANT UPDATE ON storage.objects TO authenticated;
GRANT DELETE ON storage.objects TO authenticated;

-- Grant access to storage.buckets table (for bucket information)
GRANT SELECT ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- Grant permissions for our custom RPC functions
GRANT EXECUTE ON FUNCTION get_current_user_context() TO authenticated;
GRANT EXECUTE ON FUNCTION check_username_availability(text) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_default_avatar_url(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_snacc_board_entries() TO authenticated;

-- Grant access to our public tables for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON snacc_board TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON blocked_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON snaccs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON reactions TO authenticated;

-- Grant access to sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant access to trigger functions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- Additional grants for anon users (for login/signup)
GRANT SELECT ON profiles TO anon;

-- Grant access to essential auth tables for our RLS policies
-- Note: These are typically already granted, but ensuring they exist
GRANT SELECT ON auth.users TO authenticated;

-- Ensure proper permissions on our indexes
-- (Indexes inherit permissions from their tables, but being explicit)

-- Create policy to allow anon users to check username availability
-- This is needed for the signup flow
CREATE POLICY "Allow anon to check username availability" ON profiles
  FOR SELECT TO anon USING (true);

-- Revoke the above policy and replace with a more restrictive one
DROP POLICY IF EXISTS "Allow anon to check username availability" ON profiles;

-- Create a more secure policy for anon users (only for username checks)
CREATE POLICY "Allow anon username availability check" ON profiles
  FOR SELECT TO anon USING (
    -- Only allow reading username field for availability checks
    current_setting('request.jwt.claims', true)::json->>'role' = 'anon'
  );

-- Actually, let's remove that and handle username checks via RPC function instead
DROP POLICY IF EXISTS "Allow anon username availability check" ON profiles;

-- The check_username_availability function is SECURITY DEFINER, so it can access
-- the profiles table even when called by anon users