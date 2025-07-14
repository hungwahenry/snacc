

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_mutual_follow"("user_a_id" "uuid", "user_b_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF "public"."is_user_blocked"(user_a_id, user_b_id) THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 
    FROM "public"."follows" f1
    INNER JOIN "public"."follows" f2 
      ON f1."follower_id" = f2."followee_id" 
      AND f1."followee_id" = f2."follower_id"
    WHERE f1."follower_id" = user_a_id 
      AND f1."followee_id" = user_b_id
  );
END;
$$;


ALTER FUNCTION "public"."check_mutual_follow"("user_a_id" "uuid", "user_b_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_username_availability"("username_to_check" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE username = username_to_check
  );
END;
$$;


ALTER FUNCTION "public"."check_username_availability"("username_to_check" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_blocked_user_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."cleanup_blocked_user_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_snacc_board_entries"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM snacc_board 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_snacc_board_entries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_followers_count"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles 
  SET followers_count = GREATEST(followers_count - 1, 0)
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."decrement_followers_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_following_count"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles 
  SET following_count = GREATEST(following_count - 1, 0)
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."decrement_following_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_snaccs_count"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles 
  SET snaccs_count = GREATEST(snaccs_count - 1, 0)
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."decrement_snaccs_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_default_avatar_url"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_id::TEXT;
END;
$$;


ALTER FUNCTION "public"."generate_default_avatar_url"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_profile_pic_path"("user_id" "uuid", "file_extension" "text" DEFAULT 'jpg'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN user_id::TEXT || '/profile.' || file_extension;
END;
$$;


ALTER FUNCTION "public"."generate_profile_pic_path"("user_id" "uuid", "file_extension" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_context"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_current_user_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_with_blocking_status"("profile_id" "uuid") RETURNS TABLE("profile_data" "jsonb", "is_blocked" boolean, "blocked_by_user" boolean, "user_blocked_them" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(p.*) as profile_data,
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE is_user_blocked(auth.uid(), profile_id)
    END as is_blocked,
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE blocker_id = profile_id AND blocked_id = auth.uid()
      )
    END as blocked_by_user,
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE blocker_id = auth.uid() AND blocked_id = profile_id
      )
    END as user_blocked_them
  FROM profiles p
  WHERE p.id = profile_id;
END;
$$;


ALTER FUNCTION "public"."get_profile_with_blocking_status"("profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_snacc_board_view_count"("board_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT COALESCE("views_count", 0)
    FROM "public"."snacc_board" 
    WHERE "id" = board_id
  );
END;
$$;


ALTER FUNCTION "public"."get_snacc_board_view_count"("board_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- This trigger function will be called when a new user signs up
  -- We don't create a profile here since we want users to go through onboarding
  -- This is just a placeholder for any additional user setup logic
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_followers_count"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles 
  SET followers_count = followers_count + 1 
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."increment_followers_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_following_count"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles 
  SET following_count = following_count + 1 
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."increment_following_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_snacc_board_edit_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only increment if the text content actually changed
  IF OLD.text != NEW.text THEN
    NEW.edit_count = OLD.edit_count + 1;
    NEW.last_edited_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_snacc_board_edit_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_snacc_board_views"("board_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."increment_snacc_board_views"("board_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_snaccs_count"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles 
  SET snaccs_count = snaccs_count + 1 
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."increment_snaccs_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_blocked"("user_a_id" "uuid", "user_b_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF user_a_id IS NULL OR user_b_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM "public"."blocked_users" 
    WHERE ("blocker_id" = user_a_id AND "blocked_id" = user_b_id)
       OR ("blocker_id" = user_b_id AND "blocked_id" = user_a_id)
  );
END;
$$;


ALTER FUNCTION "public"."is_user_blocked"("user_a_id" "uuid", "user_b_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_profile_counts"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE "public"."profiles" 
  SET "snaccs_count" = (
    SELECT COUNT(*) FROM "public"."snaccs" 
    WHERE "snaccs"."user_id" = "profiles"."id"
  );
  
  UPDATE "public"."profiles" 
  SET "followers_count" = (
    SELECT COUNT(*) FROM "public"."follows" 
    WHERE "follows"."followee_id" = "profiles"."id"
  );
  
  UPDATE "public"."profiles" 
  SET "following_count" = (
    SELECT COUNT(*) FROM "public"."follows" 
    WHERE "follows"."follower_id" = "profiles"."id"
  );
  
  UPDATE "public"."snacc_board" 
  SET "views_count" = (
    SELECT COUNT(*) FROM "public"."snacc_board_views" 
    WHERE "snacc_board_views"."snacc_board_id" = "snacc_board"."id"
  );
END;
$$;


ALTER FUNCTION "public"."recalculate_profile_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_snacc_board_view"("board_id" "uuid", "viewer_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."record_snacc_board_view"("board_id" "uuid", "viewer_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."replace_existing_snacc_board_entry"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Delete any existing entry for this user
  DELETE FROM snacc_board WHERE user_id = NEW.user_id AND id != NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."replace_existing_snacc_board_entry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "public"."profiles" 
    SET "followers_count" = "followers_count" + 1
    WHERE "id" = NEW."followee_id";
    
    UPDATE "public"."profiles" 
    SET "following_count" = "following_count" + 1
    WHERE "id" = NEW."follower_id";
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "public"."profiles" 
    SET "followers_count" = GREATEST("followers_count" - 1, 0)
    WHERE "id" = OLD."followee_id";
    
    UPDATE "public"."profiles" 
    SET "following_count" = GREATEST("following_count" - 1, 0)
    WHERE "id" = OLD."follower_id";
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_follow_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_snacc_board_views_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "public"."snacc_board" 
    SET "views_count" = "views_count" + 1
    WHERE "id" = NEW."snacc_board_id";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "public"."snacc_board" 
    SET "views_count" = GREATEST("views_count" - 1, 0)
    WHERE "id" = OLD."snacc_board_id";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_snacc_board_views_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_snaccs_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "public"."profiles" 
    SET "snaccs_count" = "snaccs_count" + 1
    WHERE "id" = NEW."user_id";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "public"."profiles" 
    SET "snaccs_count" = GREATEST("snaccs_count" - 1, 0)
    WHERE "id" = OLD."user_id";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_snaccs_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."blocked_users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blocked_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "followee_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "follows_check" CHECK (("follower_id" <> "followee_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "display_name" "text",
    "snacc_liner" "text",
    "snacc_pic_url" "text",
    "language" "text"[] DEFAULT ARRAY['en'::"text"],
    "interests" "text"[] DEFAULT ARRAY[]::"text"[],
    "age_range" "text",
    "gender" "text",
    "location" "text",
    "hearts_received" integer DEFAULT 0,
    "snaccs_count" integer DEFAULT 0,
    "followers_count" integer DEFAULT 0,
    "following_count" integer DEFAULT 0,
    "push_token" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_age_range_check" CHECK ((("age_range" IS NULL) OR ("age_range" = ANY (ARRAY['18-25'::"text", '26-35'::"text", '36-45'::"text", '46-55'::"text", '56+'::"text"])))),
    CONSTRAINT "profiles_display_name_length" CHECK ((("display_name" IS NULL) OR ("length"("display_name") <= 50))),
    CONSTRAINT "profiles_gender_check" CHECK ((("gender" IS NULL) OR ("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'non-binary'::"text", 'prefer-not-to-say'::"text"])))),
    CONSTRAINT "profiles_snacc_liner_length" CHECK ((("snacc_liner" IS NULL) OR ("length"("snacc_liner") <= 100))),
    CONSTRAINT "profiles_username_format" CHECK ((("username" ~ '^[a-zA-Z0-9_-]+$'::"text") AND ("length"("username") >= 3) AND ("length"("username") <= 20)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "snacc_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reactions_emoji_format" CHECK ((("length"("emoji") <= 10) AND ("length"("emoji") >= 1)))
);


ALTER TABLE "public"."reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "context" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reports_context_check" CHECK (("context" = ANY (ARRAY['video_call'::"text", 'snacc'::"text", 'profile'::"text", 'message'::"text"])))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snacc_board" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval),
    "edit_count" integer DEFAULT 0 NOT NULL,
    "last_edited_at" timestamp with time zone DEFAULT "now"(),
    "views_count" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "snacc_board_text_length" CHECK (("length"("text") <= 500))
);


ALTER TABLE "public"."snacc_board" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snacc_board_views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "snacc_board_id" "uuid" NOT NULL,
    "viewer_id" "uuid" NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."snacc_board_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snaccs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "text" "text",
    "gif_url" "text",
    CONSTRAINT "snaccs_content_check" CHECK ((("text" IS NOT NULL) OR ("gif_url" IS NOT NULL))),
    CONSTRAINT "snaccs_text_length" CHECK ((("text" IS NULL) OR ("length"("text") <= 280))),
    CONSTRAINT "snaccs_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'followers_only'::"text"])))
);


ALTER TABLE "public"."snaccs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."blocked_users"
    ADD CONSTRAINT "blocked_users_blocker_id_blocked_id_key" UNIQUE ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."blocked_users"
    ADD CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_followee_id_key" UNIQUE ("follower_id", "followee_id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_user_snacc_unique" UNIQUE ("snacc_id", "user_id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snacc_board"
    ADD CONSTRAINT "snacc_board_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snacc_board_views"
    ADD CONSTRAINT "snacc_board_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snacc_board_views"
    ADD CONSTRAINT "snacc_board_views_snacc_board_id_viewer_id_key" UNIQUE ("snacc_board_id", "viewer_id");



ALTER TABLE ONLY "public"."snaccs"
    ADD CONSTRAINT "snaccs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_blocked_users_bidirectional" ON "public"."blocked_users" USING "btree" ("blocker_id", "blocked_id");



CREATE INDEX "idx_blocked_users_blocked_id" ON "public"."blocked_users" USING "btree" ("blocked_id");



CREATE INDEX "idx_blocked_users_blocker_id" ON "public"."blocked_users" USING "btree" ("blocker_id");



CREATE INDEX "idx_follows_created_at" ON "public"."follows" USING "btree" ("created_at");



CREATE INDEX "idx_follows_followee_id" ON "public"."follows" USING "btree" ("followee_id");



CREATE INDEX "idx_follows_follower_id" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_follows_mutual_check" ON "public"."follows" USING "btree" ("follower_id", "followee_id");



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_reactions_emoji" ON "public"."reactions" USING "btree" ("emoji");



CREATE INDEX "idx_reactions_snacc_emoji" ON "public"."reactions" USING "btree" ("snacc_id", "emoji");



CREATE INDEX "idx_reactions_snacc_id" ON "public"."reactions" USING "btree" ("snacc_id");



CREATE INDEX "idx_reactions_user_id" ON "public"."reactions" USING "btree" ("user_id");



CREATE INDEX "idx_reports_context" ON "public"."reports" USING "btree" ("context");



CREATE INDEX "idx_reports_created_at" ON "public"."reports" USING "btree" ("created_at");



CREATE INDEX "idx_reports_reporter_id" ON "public"."reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_reports_target_id" ON "public"."reports" USING "btree" ("target_id");



CREATE INDEX "idx_snacc_board_active" ON "public"."snacc_board" USING "btree" ("expires_at", "user_id", "created_at");



CREATE INDEX "idx_snacc_board_edit_count" ON "public"."snacc_board" USING "btree" ("edit_count");



CREATE INDEX "idx_snacc_board_expires_at" ON "public"."snacc_board" USING "btree" ("expires_at");



CREATE INDEX "idx_snacc_board_last_edited_at" ON "public"."snacc_board" USING "btree" ("last_edited_at");



CREATE INDEX "idx_snacc_board_user_expires" ON "public"."snacc_board" USING "btree" ("user_id", "expires_at");



CREATE INDEX "idx_snacc_board_user_id" ON "public"."snacc_board" USING "btree" ("user_id");



CREATE INDEX "idx_snacc_board_views_board_id" ON "public"."snacc_board_views" USING "btree" ("snacc_board_id");



CREATE INDEX "idx_snacc_board_views_viewed_at" ON "public"."snacc_board_views" USING "btree" ("viewed_at");



CREATE INDEX "idx_snacc_board_views_viewer_id" ON "public"."snacc_board_views" USING "btree" ("viewer_id");



CREATE INDEX "idx_snaccs_created_at" ON "public"."snaccs" USING "btree" ("created_at");



CREATE INDEX "idx_snaccs_followers_only" ON "public"."snaccs" USING "btree" ("user_id", "created_at") WHERE ("visibility" = 'followers_only'::"text");



CREATE INDEX "idx_snaccs_public" ON "public"."snaccs" USING "btree" ("created_at", "user_id") WHERE ("visibility" = 'public'::"text");



CREATE INDEX "idx_snaccs_user_id" ON "public"."snaccs" USING "btree" ("user_id");



CREATE INDEX "idx_snaccs_visibility" ON "public"."snaccs" USING "btree" ("visibility");



CREATE INDEX "idx_snaccs_visibility_user" ON "public"."snaccs" USING "btree" ("visibility", "user_id", "created_at");



CREATE OR REPLACE TRIGGER "trigger_cleanup_blocked_user_data" AFTER INSERT ON "public"."blocked_users" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_blocked_user_data"();



CREATE OR REPLACE TRIGGER "trigger_increment_snacc_board_edit_count" BEFORE UPDATE ON "public"."snacc_board" FOR EACH ROW EXECUTE FUNCTION "public"."increment_snacc_board_edit_count"();



CREATE OR REPLACE TRIGGER "trigger_update_follow_counts" AFTER INSERT OR DELETE ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."update_follow_counts"();



CREATE OR REPLACE TRIGGER "trigger_update_snacc_board_views_count" AFTER INSERT OR DELETE OR UPDATE ON "public"."snacc_board_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_snacc_board_views_count"();



CREATE OR REPLACE TRIGGER "trigger_update_snaccs_count" AFTER INSERT OR DELETE ON "public"."snaccs" FOR EACH ROW EXECUTE FUNCTION "public"."update_snaccs_count"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_snaccs_updated_at" BEFORE UPDATE ON "public"."snaccs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."blocked_users"
    ADD CONSTRAINT "blocked_users_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocked_users"
    ADD CONSTRAINT "blocked_users_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_followee_id_fkey" FOREIGN KEY ("followee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_snacc_id_fkey" FOREIGN KEY ("snacc_id") REFERENCES "public"."snaccs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snacc_board"
    ADD CONSTRAINT "snacc_board_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snacc_board_views"
    ADD CONSTRAINT "snacc_board_views_snacc_board_id_fkey" FOREIGN KEY ("snacc_board_id") REFERENCES "public"."snacc_board"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snacc_board_views"
    ADD CONSTRAINT "snacc_board_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snaccs"
    ADD CONSTRAINT "snaccs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Users can create blocks" ON "public"."blocked_users" FOR INSERT WITH CHECK (("auth"."uid"() = "blocker_id"));



CREATE POLICY "Users can create reports" ON "public"."reports" FOR INSERT WITH CHECK (("auth"."uid"() = "reporter_id"));



CREATE POLICY "Users can delete their own blocks" ON "public"."blocked_users" FOR DELETE USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "Users can delete their own follows" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can delete their own profile" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete their own reactions" ON "public"."reactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own snacc board entries" ON "public"."snacc_board" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own snaccs" ON "public"."snaccs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own follows" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own reactions" ON "public"."reactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own snacc board entries" ON "public"."snacc_board" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own snaccs" ON "public"."snaccs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own view records" ON "public"."snacc_board_views" FOR INSERT WITH CHECK (("auth"."uid"() = "viewer_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own snacc board entries" ON "public"."snacc_board" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own snaccs" ON "public"."snaccs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own view records" ON "public"."snacc_board_views" FOR UPDATE USING (("auth"."uid"() = "viewer_id"));



CREATE POLICY "Users can view any profile unless blocked" ON "public"."profiles" FOR SELECT USING ((NOT (EXISTS ( SELECT 1
   FROM "public"."blocked_users"
  WHERE ((("blocked_users"."blocker_id" = "auth"."uid"()) AND ("blocked_users"."blocked_id" = "blocked_users"."id")) OR (("blocked_users"."blocker_id" = "blocked_users"."id") AND ("blocked_users"."blocked_id" = "auth"."uid"())))))));



CREATE POLICY "Users can view follows" ON "public"."follows" FOR SELECT USING ((("follower_id" = "auth"."uid"()) OR ("followee_id" = "auth"."uid"()) OR ((NOT "public"."is_user_blocked"("auth"."uid"(), "follower_id")) AND (NOT "public"."is_user_blocked"("auth"."uid"(), "followee_id")))));



CREATE POLICY "Users can view reactions" ON "public"."reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."snaccs"
  WHERE (("snaccs"."id" = "reactions"."snacc_id") AND (("snaccs"."user_id" = "auth"."uid"()) OR (("snaccs"."visibility" = 'public'::"text") AND (NOT "public"."is_user_blocked"("auth"."uid"(), "snaccs"."user_id"))) OR (("snaccs"."visibility" = 'followers_only'::"text") AND (NOT "public"."is_user_blocked"("auth"."uid"(), "snaccs"."user_id")) AND (EXISTS ( SELECT 1
           FROM "public"."follows"
          WHERE (("follows"."follower_id" = "auth"."uid"()) AND ("follows"."followee_id" = "snaccs"."user_id"))))))))));



CREATE POLICY "Users can view snacc board entries" ON "public"."snacc_board" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ((NOT "public"."is_user_blocked"("auth"."uid"(), "user_id")) AND ("expires_at" > "now"()))));



CREATE POLICY "Users can view snaccs" ON "public"."snaccs" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (("visibility" = 'public'::"text") AND (NOT "public"."is_user_blocked"("auth"."uid"(), "user_id"))) OR (("visibility" = 'followers_only'::"text") AND (NOT "public"."is_user_blocked"("auth"."uid"(), "user_id")) AND (EXISTS ( SELECT 1
   FROM "public"."follows"
  WHERE (("follows"."follower_id" = "auth"."uid"()) AND ("follows"."followee_id" = "snaccs"."user_id")))))));



CREATE POLICY "Users can view their own blocks" ON "public"."blocked_users" FOR SELECT USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "Users can view their own reports" ON "public"."reports" FOR SELECT USING (("auth"."uid"() = "reporter_id"));



CREATE POLICY "Users can view their own snacc board views" ON "public"."snacc_board_views" FOR SELECT USING (("snacc_board_id" IN ( SELECT "snacc_board"."id"
   FROM "public"."snacc_board"
  WHERE ("snacc_board"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."blocked_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."snacc_board" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."snacc_board_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."snaccs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."check_mutual_follow"("user_a_id" "uuid", "user_b_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_mutual_follow"("user_a_id" "uuid", "user_b_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_mutual_follow"("user_a_id" "uuid", "user_b_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_username_availability"("username_to_check" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_username_availability"("username_to_check" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_username_availability"("username_to_check" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_blocked_user_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_blocked_user_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_blocked_user_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_snacc_board_entries"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_snacc_board_entries"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_snacc_board_entries"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_followers_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_followers_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_followers_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_following_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_following_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_following_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_snaccs_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_snaccs_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_snaccs_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_default_avatar_url"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_default_avatar_url"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_default_avatar_url"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_profile_pic_path"("user_id" "uuid", "file_extension" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_profile_pic_path"("user_id" "uuid", "file_extension" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_profile_pic_path"("user_id" "uuid", "file_extension" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_with_blocking_status"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_with_blocking_status"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_with_blocking_status"("profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_snacc_board_view_count"("board_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_snacc_board_view_count"("board_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_snacc_board_view_count"("board_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_followers_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_followers_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_followers_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_following_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_following_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_following_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_snacc_board_edit_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_snacc_board_edit_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_snacc_board_edit_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_snacc_board_views"("board_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_snacc_board_views"("board_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_snacc_board_views"("board_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_snaccs_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_snaccs_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_snaccs_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_blocked"("user_a_id" "uuid", "user_b_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_blocked"("user_a_id" "uuid", "user_b_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_blocked"("user_a_id" "uuid", "user_b_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_profile_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_profile_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_profile_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_snacc_board_view"("board_id" "uuid", "viewer_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."record_snacc_board_view"("board_id" "uuid", "viewer_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_snacc_board_view"("board_id" "uuid", "viewer_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace_existing_snacc_board_entry"() TO "anon";
GRANT ALL ON FUNCTION "public"."replace_existing_snacc_board_entry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace_existing_snacc_board_entry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_snacc_board_views_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_snacc_board_views_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_snacc_board_views_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_snaccs_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_snaccs_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_snaccs_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."blocked_users" TO "anon";
GRANT ALL ON TABLE "public"."blocked_users" TO "authenticated";
GRANT ALL ON TABLE "public"."blocked_users" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reactions" TO "anon";
GRANT ALL ON TABLE "public"."reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."reactions" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."snacc_board" TO "anon";
GRANT ALL ON TABLE "public"."snacc_board" TO "authenticated";
GRANT ALL ON TABLE "public"."snacc_board" TO "service_role";



GRANT ALL ON TABLE "public"."snacc_board_views" TO "anon";
GRANT ALL ON TABLE "public"."snacc_board_views" TO "authenticated";
GRANT ALL ON TABLE "public"."snacc_board_views" TO "service_role";



GRANT ALL ON TABLE "public"."snaccs" TO "anon";
GRANT ALL ON TABLE "public"."snaccs" TO "authenticated";
GRANT ALL ON TABLE "public"."snaccs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
