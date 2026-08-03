# Database Migrations

This folder contains database migration scripts for the Aether-Net project.

## How to Run Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Copy the contents of the migration file you want to run
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration
7. Verify the changes in the **Table Editor**

### Option 2: Using Supabase CLI

```bash
# Make sure you have Supabase CLI installed
npx supabase migration new fix_sos_schema

# Copy the migration content to the generated file
# Then run:
npx supabase db push
```

## Available Migrations

### 001_fix_sos_schema.sql
**Purpose:** Fixes the SOS table schema mismatch that causes "Server error" when triggering SOS alerts.

**Changes:**
- Renames `user_id` → `seeker_id`
- Renames `location_lat` → `lat`
- Renames `location_lng` → `lng`
- Renames `emergency_type` → `type`
- Adds `modal_data` (JSONB) for storing additional SOS context
- Adds `first_response_guidance` (TEXT) for AI-generated guidance
- Adds `call_script` (TEXT) for emergency call scripts
- Adds `is_anonymous`, `anonymous_name`, `anonymous_blood_group` for anonymous SOS support
- Updates indexes to reflect new column names

**Status:** ⚠️ REQUIRED - Backend will fail without this migration

**Verification:**
After running the migration, you can verify it worked by running this query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sos' 
ORDER BY ordinal_position;
```

You should see the new column names (`seeker_id`, `lat`, `lng`, `type`) instead of the old ones.

## Migration Order

Migrations should be run in numerical order:
1. `001_fix_sos_schema.sql` ← **START HERE**

## Rollback

If you need to rollback a migration, check if there's a corresponding rollback file (e.g., `001_fix_sos_schema_rollback.sql`). If not, you'll need to manually reverse the changes.

## Troubleshooting

### "Column already exists" errors
This means the migration was partially applied. Check which columns exist and comment out the ones that are already created.

### "Schema cache not updating"
After running migrations, Supabase may take 1-2 minutes to refresh its cache. You can force it by running:
```sql
NOTIFY pgrst, 'reload schema';
```

### Backend still shows errors
1. Verify the migration ran successfully in Supabase Table Editor
2. Check that all column names match what the backend expects
3. Restart your backend server to clear any cached schema information
4. Check backend logs for specific error messages
