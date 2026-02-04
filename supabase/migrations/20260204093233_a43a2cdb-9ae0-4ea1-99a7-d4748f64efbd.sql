-- Add preferred_instrument column to profiles table for Standard plan users
ALTER TABLE public.profiles 
ADD COLUMN preferred_instrument TEXT NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN public.profiles.preferred_instrument IS 'The instrument chosen by the student when subscribing to Standard plan. Pro users have access to all instruments.';