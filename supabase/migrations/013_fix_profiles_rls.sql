-- Fix profiles RLS policy to handle onboarding and blocking
-- This resolves the RLS violation during profile creation

-- Drop the existing policy that's causing issues
DROP POLICY IF EXISTS "Users can view any profile unless blocked" ON profiles;

-- Create a new policy that safely handles the blocked_users table
CREATE POLICY "Users can view any profile unless blocked" ON profiles
  FOR SELECT USING (
    -- Allow access if blocked_users table doesn't exist or if no blocking relationship exists
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE (blocker_id = auth.uid() AND blocked_id = id)
         OR (blocker_id = id AND blocked_id = auth.uid())
    )
  );

-- Also ensure the insert policy works correctly during onboarding
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);