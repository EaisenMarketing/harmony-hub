
-- Add enabled_instruments array to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS enabled_instruments text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill: existing users keep access to both instruments to avoid breaking their experience.
-- If they had a preferred_instrument set, use it as a hint but still grant both for now.
UPDATE public.profiles
SET enabled_instruments = ARRAY['piano','guitar']::text[]
WHERE enabled_instruments = '{}'::text[] OR enabled_instruments IS NULL;
