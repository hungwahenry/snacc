-- Add social feature tables: follows, snaccs, and reactions

-- Create follows table
CREATE TABLE follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  followee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, followee_id),
  CHECK(follower_id != followee_id) -- Prevent self-following
);

-- Create snaccs table (user posts)
CREATE TABLE snaccs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers_only')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reactions table (emoji reactions to snaccs)
CREATE TABLE reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snacc_id UUID REFERENCES snaccs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snacc_id, user_id, emoji) -- One reaction per user per snacc per emoji type
);

-- Create indexes for better performance
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followee_id ON follows(followee_id);
CREATE INDEX idx_follows_created_at ON follows(created_at);

CREATE INDEX idx_snaccs_user_id ON snaccs(user_id);
CREATE INDEX idx_snaccs_created_at ON snaccs(created_at);
CREATE INDEX idx_snaccs_visibility ON snaccs(visibility);

CREATE INDEX idx_reactions_snacc_id ON reactions(snacc_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_emoji ON reactions(emoji);

-- Add triggers for updated_at timestamp on snaccs
CREATE TRIGGER update_snaccs_updated_at 
  BEFORE UPDATE ON snaccs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE snaccs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
CREATE POLICY "Users can view follows unless blocked" ON follows
  FOR SELECT USING (
    follower_id != ALL(
      SELECT blocked_id FROM blocked_users 
      WHERE blocker_id = auth.uid()
    )
    AND 
    followee_id != ALL(
      SELECT blocked_id FROM blocked_users 
      WHERE blocker_id = auth.uid()
    )
    AND 
    auth.uid() != ALL(
      SELECT blocker_id FROM blocked_users 
      WHERE blocked_id = follower_id
    )
    AND 
    auth.uid() != ALL(
      SELECT blocker_id FROM blocked_users 
      WHERE blocked_id = followee_id
    )
  );

CREATE POLICY "Users can insert their own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for snaccs table
CREATE POLICY "Users can view public snaccs unless blocked" ON snaccs
  FOR SELECT USING (
    visibility = 'public'
    AND user_id != ALL(
      SELECT blocked_id FROM blocked_users 
      WHERE blocker_id = auth.uid()
    )
    AND 
    auth.uid() != ALL(
      SELECT blocker_id FROM blocked_users 
      WHERE blocked_id = user_id
    )
  );

CREATE POLICY "Users can view followers-only snaccs if they follow the author" ON snaccs
  FOR SELECT USING (
    visibility = 'followers_only'
    AND user_id != ALL(
      SELECT blocked_id FROM blocked_users 
      WHERE blocker_id = auth.uid()
    )
    AND 
    auth.uid() != ALL(
      SELECT blocker_id FROM blocked_users 
      WHERE blocked_id = user_id
    )
    AND (
      auth.uid() = user_id -- Own snaccs
      OR 
      EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() AND followee_id = user_id
      ) -- Following the author
    )
  );

CREATE POLICY "Users can insert their own snaccs" ON snaccs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snaccs" ON snaccs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snaccs" ON snaccs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reactions table
CREATE POLICY "Users can view reactions unless blocked" ON reactions
  FOR SELECT USING (
    user_id != ALL(
      SELECT blocked_id FROM blocked_users 
      WHERE blocker_id = auth.uid()
    )
    AND 
    auth.uid() != ALL(
      SELECT blocker_id FROM blocked_users 
      WHERE blocked_id = user_id
    )
    AND EXISTS (
      SELECT 1 FROM snaccs 
      WHERE snaccs.id = reactions.snacc_id
      AND (
        snaccs.visibility = 'public'
        OR snaccs.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM follows 
          WHERE follower_id = auth.uid() AND followee_id = snaccs.user_id
        )
      )
    )
  );

CREATE POLICY "Users can insert their own reactions" ON reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Add functions to update follower/following counts
CREATE OR REPLACE FUNCTION increment_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET followers_count = followers_count + 1 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET followers_count = GREATEST(followers_count - 1, 0)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET following_count = following_count + 1 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET following_count = GREATEST(following_count - 1, 0)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to update snaccs count
CREATE OR REPLACE FUNCTION increment_snaccs_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET snaccs_count = snaccs_count + 1 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_snaccs_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET snaccs_count = GREATEST(snaccs_count - 1, 0)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;