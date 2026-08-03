#!/usr/bin/env node

/**
 * Check which columns exist in the SOS table
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

async function checkColumns() {
    console.log('🔍 Checking SOS table columns...\n');

    try {
        // Get one SOS record to see available columns
        const { data, error } = await supabase
            .from('sos')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('❌ Error querying SOS table:', error.message);
            process.exit(1);
        }

        const requiredForResolve = [
            'id',
            'seeker_id',
            'status',
            'created_at',
            'chat_log',
            'resolution_summary',
            'debrief_prompt',
            'response_time_seconds',
            'resolved_at'
        ];

        console.log('📋 Columns Found in SOS Table:');
        console.log('═'.repeat(60));
        
        const availableColumns = data ? Object.keys(data).sort() : [];
        const missingColumns = [];

        requiredForResolve.forEach(col => {
            const exists = availableColumns.includes(col);
            if (exists) {
                console.log(`  ✅ ${col.padEnd(30)} EXISTS`);
            } else {
                console.log(`  ❌ ${col.padEnd(30)} MISSING`);
                missingColumns.push(col);
            }
        });

        console.log('═'.repeat(60));

        if (missingColumns.length > 0) {
            console.log('\n❌ MISSING COLUMNS FOUND!');
            console.log('\nThese columns are needed for SOS resolution:');
            missingColumns.forEach(col => console.log(`  - ${col}`));
            console.log('\n🔧 ACTION REQUIRED:');
            console.log('   Run migration: backend/migrations/002_add_resolution_columns.sql');
            console.log('   In Supabase SQL Editor\n');
        } else {
            console.log('\n✅ All required columns exist!\n');
            console.log('If you\'re still getting errors, the issue is elsewhere.');
            console.log('Please share the exact error message from:');
            console.log('  1. Browser console (F12 → Console tab)');
            console.log('  2. Backend server logs\n');
        }

        console.log('📊 All Available Columns:');
        console.log('─'.repeat(60));
        availableColumns.forEach(col => console.log(`  • ${col}`));
        console.log('─'.repeat(60));
        console.log(`\nTotal: ${availableColumns.length} columns\n`);

    } catch (error) {
        console.error('\n❌ Unexpected error:', error.message);
        process.exit(1);
    }
}

checkColumns();
