-- Add support for blocked user views
-- Allow profile access but provide blocking status for better UX

-- Drop the existing restrictive policy that's causing onboarding issues
DROP POLICY IF EXISTS "Users can view any profile unless blocked" ON profiles;

-- Create a permissive policy that allows viewing all profiles
-- Blocking logic will be handled in the application layer for better UX
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

-- Function to get profile with blocking status
-- This allows the app to determine if a profile should show blocked view
CREATE OR REPLACE FUNCTION get_profile_with_blocking_status(profile_id UUID)
RETURNS TABLE (
  profile_data jsonb,
  is_blocked boolean,
  blocked_by_user boolean,
  user_blocked_them boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(p.*) as profile_data,
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE is_user_blocked(auth.uid(), profile_id)
    END as is_blocked,
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE blocker_id = profile_id AND blocked_id = auth.uid()
      )
    END as blocked_by_user,
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE blocker_id = auth.uid() AND blocked_id = profile_id
      )
    END as user_blocked_them
  FROM profiles p
  WHERE p.id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;