-- =================================================================
--  WATCH.FUN - DATABASE SCHEMA
--  Version: 1.0
--  Author: Gemini
--
--  Instructions:
--  1. Navigate to the "SQL Editor" in your Supabase project.
--  2. Click "+ New query".
--  3. Paste the entire content of this file.
--  4. Click "RUN".
-- =================================================================

-- 1. INITIAL CLEANUP
-- Drop objects in reverse order of creation to avoid dependency errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profile_interests;
DROP TABLE IF EXISTS public.interests;
DROP TABLE IF EXISTS public.profiles;
DROP TYPE IF EXISTS public.gender;

-- 2. CREATE CUSTOM TYPES
CREATE TYPE public.gender AS ENUM ('male', 'female', 'couple');

-- 3. CREATE TABLES
-- Table for public user profiles
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    dob DATE,
    gender public.gender,
    user_ip INET,
    country TEXT,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "username_length" CHECK (char_length(username) >= 3 AND char_length(username) <= 24)
);
COMMENT ON TABLE public.profiles IS 'Public profile information for each user.';

-- Table for predefined interests
CREATE TABLE public.interests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
COMMENT ON TABLE public.interests IS 'List of predefined interests users can select.';

-- Join table for profiles and interests (many-to-many relationship)
CREATE TABLE public.profile_interests (
    profile_id UUID NOT NULL,
    interest_id INTEGER NOT NULL,
    CONSTRAINT "profile_interests_pkey" PRIMARY KEY (profile_id, interest_id),
    CONSTRAINT "profile_interests_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT "profile_interests_interest_id_fkey" FOREIGN KEY (interest_id) REFERENCES public.interests(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profile_interests IS 'Links user profiles to their selected interests.';

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES
-- Policies for 'profiles' table
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for 'interests' table
CREATE POLICY "Interests are viewable by everyone." ON public.interests
    FOR SELECT USING (true);

-- Policies for 'profile_interests' table (explicitly defined for clarity)
CREATE POLICY "Users can view their own interests." ON public.profile_interests
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own interests." ON public.profile_interests
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own interests." ON public.profile_interests
    FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own interests." ON public.profile_interests
    FOR DELETE USING (auth.uid() = profile_id);

-- 6. CREATE TRIGGER FUNCTION
-- This function runs after a new user is created in 'auth.users'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- The function runs with the permissions of the user that defined it.
AS $$
BEGIN
  -- Create a new row in public.profiles for the new user.
  -- It pulls the username from the 'raw_user_meta_data' JSON field provided during signup.
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$;

-- 7. CREATE THE TRIGGER
-- This trigger calls the 'handle_new_user' function when a new user is added.
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. SEED INITIAL DATA
-- Populate the 'interests' table with some default values.
INSERT INTO public.interests (name) VALUES
    ('Football'), ('Hockey'), ('Gaming'), ('Streaming'),
    ('Movies'), ('Music'), ('Travel'), ('Reading'), ('Cooking');

-- =================================================================
-- END OF SCRIPT
-- =================================================================
