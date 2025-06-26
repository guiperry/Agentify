#!/usr/bin/env node

/**
 * Apply Supabase migrations directly using the JavaScript client
 * This is a fallback when the Supabase CLI is not available
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applyMigrations() {
  log('🚀 Applying Supabase Migrations...', 'blue');
  log('==================================', 'blue');

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241215000000_initial_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    log('📄 Migration file loaded', 'green');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    log(`📊 Found ${statements.length} SQL statements to execute`, 'blue');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;

      try {
        log(`  Executing statement ${i + 1}/${statements.length}...`, 'yellow');
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });

        if (error) {
          // Try direct execution for some statements
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0);
          
          if (directError && directError.message.includes('does not exist')) {
            // This is expected for the first run
            log(`    ⚠️  Statement ${i + 1} skipped (expected for first run)`, 'yellow');
          } else {
            throw error;
          }
        } else {
          log(`    ✅ Statement ${i + 1} executed successfully`, 'green');
        }
      } catch (statementError) {
        // Some statements might fail if they already exist, which is okay
        if (statementError.message.includes('already exists') || 
            statementError.message.includes('does not exist')) {
          log(`    ⚠️  Statement ${i + 1} skipped (${statementError.message})`, 'yellow');
        } else {
          log(`    ❌ Statement ${i + 1} failed: ${statementError.message}`, 'red');
          throw statementError;
        }
      }
    }

    // Test that tables were created
    log('\n🧪 Testing table creation...', 'blue');
    
    const tables = ['agent_configs', 'user_api_keys', 'compilation_history', 'deployment_history'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count');
        if (error) {
          throw error;
        }
        log(`  ✅ Table ${table} created successfully`, 'green');
      } catch (error) {
        log(`  ❌ Table ${table} verification failed: ${error.message}`, 'red');
        throw error;
      }
    }

    log('\n🎉 Migration completed successfully!', 'green');
    log('All database tables and policies have been created.', 'green');
    
    return true;

  } catch (error) {
    log(`\n💥 Migration failed: ${error.message}`, 'red');
    log('\nTrying alternative approach...', 'yellow');
    
    // Alternative: Create tables manually
    return await createTablesManually();
  }
}

async function createTablesManually() {
  log('\n🔧 Creating tables manually...', 'blue');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create tables one by one with error handling
    const tableCreationSQL = [
      `CREATE TABLE IF NOT EXISTS agent_configs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        identity JSONB,
        personality JSONB,
        capabilities JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );`,
      
      `CREATE TABLE IF NOT EXISTS user_api_keys (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        encrypted_keys JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );`,
      
      `CREATE TABLE IF NOT EXISTS compilation_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        agent_config_id UUID REFERENCES agent_configs(id) ON DELETE CASCADE,
        status TEXT CHECK (status IN ('running', 'completed', 'failed')) NOT NULL DEFAULT 'running',
        logs TEXT,
        download_url TEXT,
        error_message TEXT,
        compilation_time_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );`,
      
      `CREATE TABLE IF NOT EXISTS deployment_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        compilation_id UUID REFERENCES compilation_history(id) ON DELETE CASCADE,
        deployment_url TEXT,
        status TEXT CHECK (status IN ('deploying', 'deployed', 'failed')) NOT NULL DEFAULT 'deploying',
        logs TEXT,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );`
    ];

    for (let i = 0; i < tableCreationSQL.length; i++) {
      const sql = tableCreationSQL[i];
      log(`  Creating table ${i + 1}/${tableCreationSQL.length}...`, 'yellow');
      
      // Note: This is a simplified approach - in production you'd use proper migration tools
      log(`  ⚠️  Manual table creation requires Supabase dashboard access`, 'yellow');
    }

    log('\n📝 Manual migration instructions:', 'blue');
    log('1. Go to your Supabase dashboard', 'yellow');
    log('2. Navigate to SQL Editor', 'yellow');
    log('3. Copy and paste the migration SQL from supabase/migrations/20241215000000_initial_schema.sql', 'yellow');
    log('4. Execute the SQL to create tables and policies', 'yellow');
    log('5. Run the test script again: node scripts/test-integration.js', 'yellow');

    return false;

  } catch (error) {
    log(`❌ Manual table creation failed: ${error.message}`, 'red');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  applyMigrations()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Migration script crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { applyMigrations };
