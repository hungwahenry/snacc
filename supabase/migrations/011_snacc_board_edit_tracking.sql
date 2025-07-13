-- Add edit tracking to snacc_board table
-- Track how many times a snacc board has been edited since creation

-- Add edit_count column to track number of edits
ALTER TABLE snacc_board ADD COLUMN edit_count INTEGER DEFAULT 0 NOT NULL;

-- Add last_edited_at column to track when it was last modified
ALTER TABLE snacc_board ADD COLUMN last_edited_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for performance
CREATE INDEX idx_snacc_board_edit_count ON snacc_board(edit_count);
CREATE INDEX idx_snacc_board_last_edited_at ON snacc_board(last_edited_at);

-- Function to increment edit count when snacc board is updated
CREATE OR REPLACE FUNCTION increment_snacc_board_edit_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if the text content actually changed
  IF OLD.text != NEW.text THEN
    NEW.edit_count = OLD.edit_count + 1;
    NEW.last_edited_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment edit count on updates
CREATE TRIGGER trigger_increment_snacc_board_edit_count
  BEFORE UPDATE ON snacc_board
  FOR EACH ROW
  EXECUTE FUNCTION increment_snacc_board_edit_count();

-- Update existing records to set initial values
UPDATE snacc_board 
SET edit_count = 0, last_edited_at = created_at 
WHERE edit_count IS NULL OR last_edited_at IS NULL;