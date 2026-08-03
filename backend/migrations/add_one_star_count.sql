-- Migration: Add one_star_count column to users table
-- This tracks how many 1-star ratings a user has received
-- Users with more than 3 one-star ratings will be automatically suspended

-- Add the column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS one_star_count INTEGER DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_one_star_count ON public.users(one_star_count);

-- Add comment explaining the column
COMMENT ON COLUMN public.users.one_star_count IS 'Tracks the number of 1-star ratings received. Auto-suspension occurs after 3+ one-star ratings.';

-- Update existing users to have 0 one_star_count if NULL
UPDATE public.users SET one_star_count = 0 WHERE one_star_count IS NULL;

-- Optional: Calculate existing one-star counts from ratings table
-- (Run this if you have existing ratings data)
-- UPDATE public.users u
-- SET one_star_count = (
--     SELECT COUNT(*) 
--     FROM public.ratings r 
--     WHERE r.responder_id = u.id AND r.stars = 1
-- );
