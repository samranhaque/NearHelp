-- ==============================================================================
-- Migration: Add Resolution and Chat Columns to SOS Table
-- ==============================================================================
-- This adds missing columns needed for SOS resolution and chat functionality
-- Run this if you're getting "column does not exist" errors when resolving SOS
-- ==============================================================================

-- Add columns for resolution tracking
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS chat_log JSONB;
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS resolution_summary TEXT;
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS debrief_prompt TEXT;
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFICATION: Run this query after migration to confirm columns exist
-- ==============================================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'sos' 
-- AND column_name IN ('chat_log', 'resolution_summary', 'debrief_prompt', 'response_time_seconds')
-- ORDER BY column_name;
