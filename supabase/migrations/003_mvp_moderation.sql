CREATE TYPE public.user_role AS ENUM (
  'free',
  'vip',
  'boost',
  'mod',
  'admin'
);

ALTER TABLE public.profiles
ADD COLUMN role public.user_role NOT NULL DEFAULT 'free',
ADD COLUMN times_reported integer NOT NULL DEFAULT 0;

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'PENDING', -- PENDING, REVIEWED, ACTION_TAKEN
  reporting_user_id uuid NOT NULL REFERENCES public.profiles(id),
  reported_user_id uuid NOT NULL REFERENCES public.profiles(id),
  chat_log jsonb, -- Stores the last 10 messages
  evidence_url text -- Public URL from your 'reported-images' bucket
);

-- Add indexes for faster queries in your moderation dashboard
CREATE INDEX ON public.reports (status);
CREATE INDEX ON public.reports (reported_user_id);

CREATE OR REPLACE FUNCTION increment_times_reported(user_id uuid)
RETURNS void AS $$
  UPDATE public.profiles
  SET times_reported = times_reported + 1
  WHERE id = user_id;
$$ LANGUAGE sql;
