-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  snacc_liner TEXT,
  snacc_pic_url TEXT,
  language TEXT[] DEFAULT ARRAY['en'],
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  age_range TEXT,
  gender TEXT,
  location TEXT,
  hearts_received INTEGER DEFAULT 0,
  snaccs_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create snacc_board table for temporary posts
CREATE TABLE snacc_board (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create blocked_users table
CREATE TABLE blocked_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_snacc_board_user_id ON snacc_board(user_id);
CREATE INDEX idx_snacc_board_expires_at ON snacc_board(expires_at);
CREATE INDEX idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles table
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired snacc board entries
CREATE OR REPLACE FUNCTION cleanup_expired_snacc_board()
RETURNS void AS $$
BEGIN
  DELETE FROM snacc_board WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE snacc_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view any profile unless blocked" ON profiles
  FOR SELECT USING (
    id != ALL(
      SELECT blocked_id FROM blocked_users 
      WHERE blocker_id = auth.uid()
    )
    AND 
    auth.uid() != ALL(
      SELECT blocker_id FROM blocked_users 
      WHERE blocked_id = id
    )
  );

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- RLS Policies for snacc_board table
CREATE POLICY "Users can view snacc board unless blocked" ON snacc_board
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
    AND expires_at > NOW()
  );

CREATE POLICY "Users can insert their own snacc board entries" ON snacc_board
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snacc board entries" ON snacc_board
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snacc board entries" ON snacc_board
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blocked_users table
CREATE POLICY "Users can view their own blocks" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);