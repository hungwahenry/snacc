-- Grant permissions for social feature functions

-- Grant access to count increment/decrement functions
GRANT EXECUTE ON FUNCTION increment_followers_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_followers_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_following_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_following_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_snaccs_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_snaccs_count(UUID) TO authenticated;