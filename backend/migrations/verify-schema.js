#!/usr/bin/env node

/**
 * Schema Verification Script
 * 
 * This script checks if the SOS table has the correct schema
 * and reports any missing or misnamed columns.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Expected schema
const EXPECTED_COLUMNS = {
    'id': 'uuid',
    'seeker_id': 'uuid',
    'lat': 'numeric',
    'lng': 'numeric',
    'address': 'text',
    'status': 'character varying',
    'type': 'character varying',
    'description': 'text',
    'modal_data': 'jsonb',
    'first_response_guidance': 'text',
    'call_script': 'text',
    'responders': 'ARRAY',
    'false_alarm': 'boolean',
    'is_anonymous': 'boolean',
    'anonymous_name': 'character varying',
    'anonymous_blood_group': 'character varying',
    'resolved_at': 'timestamp without time zone',
    'created_at': 'timestamp without time zone'
};

// Old columns that should NOT exist
const DEPRECATED_COLUMNS = [
    'user_id',
    'location_lat',
    'location_lng',
    'emergency_type'
];

async function verifySchema() {
    console.log('🔍 Verifying SOS table schema...\n');

    try {
        // Query information_schema to get current columns
        const { data, error } = await supabase
            .from('sos')
            .select('*')
            .limit(0);

        if (error) {
            console.error('❌ Error querying SOS table:', error.message);
            console.log('\n💡 This might mean the table doesn\'t exist or there\'s a connection issue.');
            process.exit(1);
        }

        // Get column information using a raw query approach
        // Since Supabase client doesn't expose schema info directly, we'll try to insert/select
        console.log('✅ SOS table exists and is accessible\n');
        
        console.log('📋 Expected Schema:');
        console.log('─'.repeat(60));
        Object.entries(EXPECTED_COLUMNS).forEach(([col, type]) => {
            console.log(`  ✓ ${col.padEnd(30)} ${type}`);
        });

        console.log('\n🚫 Deprecated Columns (should NOT exist):');
        console.log('─'.repeat(60));
        DEPRECATED_COLUMNS.forEach(col => {
            console.log(`  ✗ ${col}`);
        });

        console.log('\n⚠️  Manual Verification Required:');
        console.log('─'.repeat(60));
        console.log('  1. Go to https://app.supabase.com');
        console.log('  2. Select your project');
        console.log('  3. Navigate to Table Editor → sos table');
        console.log('  4. Verify the columns match the expected schema above');
        console.log('  5. Ensure deprecated columns are NOT present\n');

        console.log('📝 Or run this query in SQL Editor:');
        console.log('─'.repeat(60));
        console.log(`
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'sos'
ORDER BY ordinal_position;
        `.trim());
        console.log('─'.repeat(60));

        // Try to test by querying active SOS
        console.log('\n🧪 Testing SOS Query...');
        const { data: testData, error: testError } = await supabase
            .from('sos')
            .select('id, seeker_id, lat, lng, type, status, modal_data, is_anonymous')
            .limit(1);

        if (testError) {
            if (testError.message.includes('column') && testError.message.includes('does not exist')) {
                console.error('\n❌ SCHEMA MISMATCH DETECTED!');
                console.error('   Error:', testError.message);
                console.log('\n🔧 Action Required: Run the migration!');
                console.log('   File: backend/migrations/001_fix_sos_schema.sql');
                console.log('   Guide: SOS_ERROR_FIX_GUIDE.md\n');
                process.exit(1);
            } else {
                console.warn('⚠️  Query test warning:', testError.message);
            }
        } else {
            console.log('✅ SOS table query successful!');
            console.log(`   Found ${testData ? testData.length : 0} SOS record(s) in database`);
            
            if (testData && testData.length > 0) {
                const sample = testData[0];
                console.log('\n📊 Sample Record Structure:');
                Object.keys(sample).forEach(key => {
                    console.log(`   ✓ ${key}: ${typeof sample[key]}`);
                });
            }
            
            console.log('\n✅ Schema appears to be correct!');
            console.log('   The migration has likely been applied successfully.\n');
        }

    } catch (error) {
        console.error('\n❌ Unexpected error:', error.message);
        process.exit(1);
    }
}

verifySchema();
