-- MIGRATION: 001_fix_new_user_trigger.sql
--
-- REASON: The original trigger expected a username during sign-up, but this is now
-- handled in the post-signup account setup flow. This script updates the function
-- to create a profile without a username, which correctly triggers the app to
-- redirect the user to the account setup page.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a new row in public.profiles for the new user.
  -- The username will be null by default and set in the app's account setup flow.
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;
