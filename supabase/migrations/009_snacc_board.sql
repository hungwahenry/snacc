-- Create snacc_board table for ephemeral thought posts
-- Each user can have one active board entry that expires after 24 hours

CREATE TABLE snacc_board (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 150), -- 150 character limit
  views_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(user_id) -- Only one active entry per user
);

-- Create indexes for performance
CREATE INDEX idx_snacc_board_user_id ON snacc_board(user_id);
CREATE INDEX idx_snacc_board_expires_at ON snacc_board(expires_at);

-- Enable Row Level Security
ALTER TABLE snacc_board ENABLE ROW LEVEL SECURITY;

-- RLS Policies for snacc_board table
-- Anyone can view active (non-expired) snacc board entries unless blocked
CREATE POLICY "Users can view active snacc board entries unless blocked" ON snacc_board
  FOR SELECT USING (
    expires_at > NOW() -- Only show non-expired entries
    AND user_id != ALL(
      SELECT blocked_id FROM blocked_users 
      WHERE blocker_id = auth.uid()
    )
    AND auth.uid() != ALL(
      SELECT blocker_id FROM blocked_users 
      WHERE blocked_id = user_id
    )
  );

-- Users can insert their own snacc board entries
CREATE POLICY "Users can insert their own snacc board entries" ON snacc_board
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own snacc board entries
CREATE POLICY "Users can update their own snacc board entries" ON snacc_board
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own snacc board entries
CREATE POLICY "Users can delete their own snacc board entries" ON snacc_board
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically clean up expired snacc board entries
CREATE OR REPLACE FUNCTION cleanup_expired_snacc_board_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM snacc_board WHERE expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to ensure only one active entry per user
-- When inserting a new entry, delete any existing entry for that user
CREATE OR REPLACE FUNCTION replace_existing_snacc_board_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete any existing entry for this user
  DELETE FROM snacc_board WHERE user_id = NEW.user_id AND id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_replace_snacc_board_entry
  AFTER INSERT ON snacc_board
  FOR EACH ROW
  EXECUTE FUNCTION replace_existing_snacc_board_entry();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_snacc_board_views(board_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE snacc_board 
  SET views_count = views_count + 1 
  WHERE id = board_id AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;