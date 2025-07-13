-- RPC function to get current user context (hydration)
CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS JSON AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  user_snacc_board snacc_board%ROWTYPE;
  blocked_user_ids TEXT[];
  result JSON;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = auth.uid();

  -- If profile doesn't exist, return null
  IF user_profile IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get current snacc board entry (if exists and not expired)
  SELECT * INTO user_snacc_board
  FROM snacc_board
  WHERE user_id = auth.uid()
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get list of blocked user IDs
  SELECT ARRAY_AGG(blocked_id::TEXT) INTO blocked_user_ids
  FROM blocked_users
  WHERE blocker_id = auth.uid();

  -- Build result JSON
  result := json_build_object(
    'profile', row_to_json(user_profile),
    'snacc_board', 
      CASE 
        WHEN user_snacc_board IS NOT NULL THEN row_to_json(user_snacc_board)
        ELSE NULL
      END,
    'push_token', user_profile.push_token,
    'unread_notifications_count', 0, -- TODO: implement when notifications table exists
    'unread_dm_count', 0, -- TODO: implement when DM tables exist
    'blocked_users', COALESCE(blocked_user_ids, ARRAY[]::TEXT[])
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if username is available
CREATE OR REPLACE FUNCTION check_username_availability(username_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE username = username_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate a default profile picture URL using DiceBear
CREATE OR REPLACE FUNCTION generate_default_avatar_url(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_id::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup and profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This trigger function will be called when a new user signs up
  -- We don't create a profile here since we want users to go through onboarding
  -- This is just a placeholder for any additional user setup logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup (optional, for future use)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to cleanup expired snacc board entries (to be called by a scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_snacc_board_entries()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM snacc_board 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;