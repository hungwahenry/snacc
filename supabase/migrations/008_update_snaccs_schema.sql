-- Update snaccs table to match documentation requirements
-- Replace content field with separate text and gif_url fields

-- First, add new columns
ALTER TABLE snaccs ADD COLUMN text TEXT;
ALTER TABLE snaccs ADD COLUMN gif_url TEXT;

-- Migrate existing content to text field (if any data exists)
UPDATE snaccs SET text = content WHERE content IS NOT NULL;

-- Drop the old content column
ALTER TABLE snaccs DROP COLUMN content;

-- Add constraint to ensure at least one of text or gif_url is present
ALTER TABLE snaccs ADD CONSTRAINT snaccs_content_check 
  CHECK (text IS NOT NULL OR gif_url IS NOT NULL);

-- Update the unique constraint for reactions to be per user per snacc (not per emoji)
-- First drop the existing constraint
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_snacc_id_user_id_emoji_key;

-- Add the correct unique constraint (one reaction per user per snacc)
ALTER TABLE reactions ADD CONSTRAINT reactions_user_snacc_unique 
  UNIQUE(snacc_id, user_id);