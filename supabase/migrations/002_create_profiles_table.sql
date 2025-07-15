-- Create a custom type for gender
CREATE TYPE public.gender AS ENUM (
    'male',
    'female',
    'couple'
);

-- Create the profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    dob DATE,
    gender public.gender,
    user_ip INET,
    country TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments to the columns
COMMENT ON COLUMN public.profiles.id IS 'Foreign key to auth.users.id';
COMMENT ON COLUMN public.profiles.username IS 'User''s public display name';
COMMENT ON COLUMN public.profiles.user_ip IS 'IP address at the time of creation';
COMMENT ON COLUMN public.profiles.country IS 'Country determined from IP (requires external service)';

-- Set up Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- NOTE: This script assumes the public.interests table already exists.
-- CREATE TABLE public.interests ( id SERIAL PRIMARY KEY, name TEXT NOT NULL, emoji TEXT );

-- Create the profile_interests join table
CREATE TABLE public.profile_interests (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_id INTEGER NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, interest_id)
);

-- Set up Row Level Security (RLS) for profile_interests
ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interests" ON public.profile_interests
FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can manage their own interests" ON public.profile_interests
FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);


-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a new row into public.profiles
    INSERT INTO public.profiles (id, user_ip, created_at, updated_at)
    VALUES (
        NEW.id,
        inet_client_addr(),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to execute the function on new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically update the `updated_at` timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for the updated_at timestamp on profiles
CREATE TRIGGER handle_profile_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();