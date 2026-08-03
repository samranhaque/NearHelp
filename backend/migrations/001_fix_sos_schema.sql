-- ==============================================================================
-- Migration: Fix SOS Table Schema (Run this in Supabase SQL Editor)
-- ==============================================================================
-- This migration aligns the database schema with the backend code expectations
-- ==============================================================================

-- 1. Rename existing columns to match what the backend Node.js code expects
ALTER TABLE public.sos RENAME COLUMN user_id TO seeker_id;
ALTER TABLE public.sos RENAME COLUMN location_lat TO lat;
ALTER TABLE public.sos RENAME COLUMN location_lng TO lng;
ALTER TABLE public.sos RENAME COLUMN emergency_type TO type;

-- 2. Add the missing columns for AI Guidance and Modal Data
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS modal_data JSONB;
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS first_response_guidance TEXT;
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS call_script TEXT;

-- 3. Add the missing columns for Anonymous SOS support
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS anonymous_name VARCHAR(255);
ALTER TABLE public.sos ADD COLUMN IF NOT EXISTS anonymous_blood_group VARCHAR(10);

-- 4. Update indexes to use new column names
DROP INDEX IF EXISTS idx_sos_user_id;
CREATE INDEX IF NOT EXISTS idx_sos_seeker_id ON public.sos(seeker_id);

-- 5. Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFICATION QUERY (run this after the migration to verify)
-- ==============================================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'sos' 
-- ORDER BY ordinal_position;
