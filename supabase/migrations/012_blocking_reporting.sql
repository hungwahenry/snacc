-- Create tables for blocking and reporting functionality
-- Implements the blocking and reporting system as detailed in blocking-reporting.md

-- Create blocked_users table
CREATE TABLE blocked_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id) -- Prevent duplicate blocks
);

-- Create reports table
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  context TEXT NOT NULL CHECK (context IN ('video_call', 'snacc', 'profile', 'message')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON blocked_users(blocked_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_target_id ON reports(target_id);
CREATE INDEX idx_reports_context ON reports(context);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Enable Row Level Security
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_users table
-- Users can view their own blocking records (who they blocked)
CREATE POLICY "Users can view their own blocks" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can create their own blocks
CREATE POLICY "Users can create blocks" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete their own blocks" ON blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- RLS Policies for reports table  
-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Function to check if user A has blocked user B
CREATE OR REPLACE FUNCTION is_user_blocked(user_a_id UUID, user_b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (blocker_id = user_a_id AND blocked_id = user_b_id)
       OR (blocker_id = user_b_id AND blocked_id = user_a_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up data when a user is blocked
CREATE OR REPLACE FUNCTION cleanup_blocked_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove mutual follows
  DELETE FROM follows 
  WHERE (follower_id = NEW.blocker_id AND followee_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND followee_id = NEW.blocker_id);
  
  -- Remove reactions on snaccs
  DELETE FROM reactions 
  WHERE (user_id = NEW.blocker_id AND snacc_id IN (
    SELECT id FROM snaccs WHERE user_id = NEW.blocked_id
  )) OR (user_id = NEW.blocked_id AND snacc_id IN (
    SELECT id FROM snaccs WHERE user_id = NEW.blocker_id
  ));
  
  -- Remove snacc board views
  DELETE FROM snacc_board_views
  WHERE (viewer_id = NEW.blocker_id AND snacc_board_id IN (
    SELECT id FROM snacc_board WHERE user_id = NEW.blocked_id
  )) OR (viewer_id = NEW.blocked_id AND snacc_board_id IN (
    SELECT id FROM snacc_board WHERE user_id = NEW.blocker_id
  ));
  
  -- Update snacc board views counts after cleanup
  UPDATE snacc_board 
  SET views_count = (
    SELECT COUNT(*) FROM snacc_board_views 
    WHERE snacc_board_id = snacc_board.id
  )
  WHERE user_id = NEW.blocker_id OR user_id = NEW.blocked_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to cleanup data when user is blocked
CREATE TRIGGER trigger_cleanup_blocked_user_data
  AFTER INSERT ON blocked_users
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_blocked_user_data();

-- Function to check mutual follow status (needed for DM eligibility)
CREATE OR REPLACE FUNCTION check_mutual_follow(user_a_id UUID, user_b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Return false if either user has blocked the other
  IF is_user_blocked(user_a_id, user_b_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if both users follow each other
  RETURN EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = user_a_id AND followee_id = user_b_id
  ) AND EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = user_b_id AND followee_id = user_a_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;