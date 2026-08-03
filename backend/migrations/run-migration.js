#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * This script runs database migrations programmatically using the Supabase service key.
 * 
 * Usage:
 *   node run-migration.js <migration-file>
 * 
 * Example:
 *   node run-migration.js 001_fix_sos_schema.sql
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
    process.exit(1);
}

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
    console.error('❌ Error: Please provide a migration file name');
    console.log('\nUsage: node run-migration.js <migration-file>');
    console.log('Example: node run-migration.js 001_fix_sos_schema.sql');
    process.exit(1);
}

const migrationPath = path.join(__dirname, migrationFile);
if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: Migration file not found: ${migrationPath}`);
    process.exit(1);
}

// Create Supabase client with service key
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
    console.log('🚀 Starting migration...\n');
    console.log(`📄 Migration file: ${migrationFile}`);
    console.log(`📍 Location: ${migrationPath}\n`);

    try {
        // Read the SQL file
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Remove comments and split into individual statements
        const statements = sql
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n')
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
            
            // Use rpc to execute raw SQL
            const { data, error } = await supabase.rpc('exec_sql', { sql_string: statement });
            
            if (error) {
                // If exec_sql doesn't exist, try direct query
                if (error.message.includes('exec_sql')) {
                    console.warn('⚠️  exec_sql function not found, attempting direct query...');
                    // This won't work for DDL statements through the REST API
                    console.error('❌ Cannot execute DDL statements directly through REST API');
                    console.log('\n📝 Please run this migration manually in Supabase SQL Editor:');
                    console.log('   1. Go to https://app.supabase.com');
                    console.log('   2. Select your project');
                    console.log('   3. Navigate to SQL Editor');
                    console.log('   4. Copy and paste the contents of:', migrationPath);
                    console.log('   5. Click Run\n');
                    process.exit(1);
                } else {
                    throw error;
                }
            }
            
            console.log(`✅ Statement ${i + 1} executed successfully`);
        }

        console.log('\n🎉 Migration completed successfully!\n');
        console.log('📋 Next steps:');
        console.log('   1. Verify changes in Supabase Table Editor');
        console.log('   2. Restart your backend server');
        console.log('   3. Test SOS trigger functionality\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.log('\n📝 Manual migration required:');
        console.log('   Run the migration file manually in Supabase SQL Editor');
        console.log(`   File: ${migrationPath}\n`);
        process.exit(1);
    }
}

// Run the migration
runMigration();
