-- Create snacc_board_views table for individual view tracking
-- Each record represents one user viewing another user's snacc board
-- Ensures one view record per user per snacc board

CREATE TABLE snacc_board_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snacc_board_id UUID REFERENCES snacc_board(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snacc_board_id, viewer_id) -- One view record per user per snacc board
);

-- Create indexes for performance
CREATE INDEX idx_snacc_board_views_board_id ON snacc_board_views(snacc_board_id);
CREATE INDEX idx_snacc_board_views_viewer_id ON snacc_board_views(viewer_id);
CREATE INDEX idx_snacc_board_views_viewed_at ON snacc_board_views(viewed_at);

-- Enable Row Level Security
ALTER TABLE snacc_board_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for snacc_board_views table
-- Users can view records for their own snacc boards (to see who viewed them)
CREATE POLICY "Users can view their own snacc board views" ON snacc_board_views
  FOR SELECT USING (
    snacc_board_id IN (
      SELECT id FROM snacc_board WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own view records (when viewing others' boards)
CREATE POLICY "Users can insert their own view records" ON snacc_board_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Users can update their own view records (to update viewed_at timestamp)
CREATE POLICY "Users can update their own view records" ON snacc_board_views
  FOR UPDATE USING (auth.uid() = viewer_id);

-- Function to record a view (upsert to update timestamp if already exists)
CREATE OR REPLACE FUNCTION record_snacc_board_view(board_id UUID, viewer_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Only record view if viewer is not the owner
  IF NOT EXISTS (
    SELECT 1 FROM snacc_board 
    WHERE id = board_id AND user_id = viewer_user_id
  ) THEN
    -- Upsert: insert new view or update timestamp if already exists
    INSERT INTO snacc_board_views (snacc_board_id, viewer_id, viewed_at)
    VALUES (board_id, viewer_user_id, NOW())
    ON CONFLICT (snacc_board_id, viewer_id)
    DO UPDATE SET viewed_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get view count for a snacc board
CREATE OR REPLACE FUNCTION get_snacc_board_view_count(board_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM snacc_board_views 
    WHERE snacc_board_id = board_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the increment_snacc_board_views function to use the new system
CREATE OR REPLACE FUNCTION increment_snacc_board_views(board_id UUID)
RETURNS void AS $$
DECLARE
  viewer_user_id UUID;
BEGIN
  -- Get the current authenticated user
  viewer_user_id := auth.uid();
  
  -- Only proceed if user is authenticated
  IF viewer_user_id IS NOT NULL THEN
    -- Record the view using the new function
    PERFORM record_snacc_board_view(board_id, viewer_user_id);
    
    -- Update the denormalized views_count in snacc_board table
    UPDATE snacc_board 
    SET views_count = get_snacc_board_view_count(board_id)
    WHERE id = board_id AND expires_at > NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update views_count when snacc_board_views changes
CREATE OR REPLACE FUNCTION update_snacc_board_views_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE snacc_board 
    SET views_count = get_snacc_board_view_count(NEW.snacc_board_id)
    WHERE id = NEW.snacc_board_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE snacc_board 
    SET views_count = get_snacc_board_view_count(OLD.snacc_board_id)
    WHERE id = OLD.snacc_board_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_snacc_board_views_count
  AFTER INSERT OR UPDATE OR DELETE ON snacc_board_views
  FOR EACH ROW
  EXECUTE FUNCTION update_snacc_board_views_count();