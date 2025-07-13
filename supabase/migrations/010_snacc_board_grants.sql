-- Grant permissions for snacc_board table and related functions

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON snacc_board TO authenticated;

-- Grant usage on the UUID extension (if not already granted)
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant execute permissions on snacc board functions
GRANT EXECUTE ON FUNCTION cleanup_expired_snacc_board_entries() TO authenticated;
GRANT EXECUTE ON FUNCTION replace_existing_snacc_board_entry() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_snacc_board_views(UUID) TO authenticated;