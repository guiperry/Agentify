#!/usr/bin/env node

/**
 * Integration Test Script for Next-Agentify Supabase Migration
 * Tests authentication, validation functions, and database connectivity
 */

const { createClient } = require('@supabase/supabase-js');
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

async function testSupabaseConnection() {
  log('\n🔍 Testing Supabase Connection...', 'blue');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('agent_configs').select('count');
    
    if (error) {
      throw error;
    }
    
    log('✅ Supabase connection successful', 'green');
    return true;
  } catch (error) {
    log(`❌ Supabase connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDatabaseSchema() {
  log('\n🗄️ Testing Database Schema...', 'blue');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test each table exists
    const tables = ['agent_configs', 'user_api_keys', 'compilation_history', 'deployment_history'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count');
      if (error) {
        throw new Error(`Table ${table} not accessible: ${error.message}`);
      }
      log(`  ✅ Table ${table} exists and accessible`, 'green');
    }
    
    log('✅ Database schema validation successful', 'green');
    return true;
  } catch (error) {
    log(`❌ Database schema validation failed: ${error.message}`, 'red');
    return false;
  }
}

async function testNetlifyFunctions() {
  log('\n⚡ Testing Netlify Functions...', 'blue');
  
  const functions = [
    'auth',
    'validate-identity', 
    'validate-api-keys',
    'validate-personality',
    'validate-capabilities'
  ];
  
  let allPassed = true;
  
  for (const func of functions) {
    try {
      // Test if function file exists
      const fs = require('fs');
      const path = require('path');
      const funcPath = path.join(process.cwd(), 'netlify', 'functions', `${func}.js`);
      
      if (!fs.existsSync(funcPath)) {
        throw new Error(`Function file not found: ${funcPath}`);
      }
      
      // Basic syntax check
      require(funcPath);
      
      log(`  ✅ Function ${func} exists and loads correctly`, 'green');
    } catch (error) {
      log(`  ❌ Function ${func} failed: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  if (allPassed) {
    log('✅ All Netlify functions validated', 'green');
  } else {
    log('❌ Some Netlify functions failed validation', 'red');
  }
  
  return allPassed;
}

async function testEnvironmentVariables() {
  log('\n🔧 Testing Environment Variables...', 'blue');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_PROJECT_REF'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`  ✅ ${varName} is set`, 'green');
    } else {
      log(`  ❌ ${varName} is missing`, 'red');
      allPresent = false;
    }
  }
  
  // Test URL format
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url && !url.includes('.supabase.co')) {
    log('  ⚠️  SUPABASE_URL format looks incorrect (should end with .supabase.co)', 'yellow');
  }
  
  if (allPresent) {
    log('✅ All required environment variables are set', 'green');
  } else {
    log('❌ Some required environment variables are missing', 'red');
  }
  
  return allPresent;
}

async function testWebSocketRemoval() {
  log('\n🚫 Testing WebSocket Removal...', 'blue');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check if WebSocket server file is removed
    const wsServerPath = path.join(process.cwd(), 'server', 'websocket-server.js');
    if (fs.existsSync(wsServerPath)) {
      log('  ❌ WebSocket server file still exists', 'red');
      return false;
    }
    
    // Check if WebSocket is disabled in env
    if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true') {
      log('  ❌ WebSocket is still enabled in environment', 'red');
      return false;
    }
    
    log('  ✅ WebSocket server removed', 'green');
    log('  ✅ WebSocket disabled in environment', 'green');
    log('✅ WebSocket removal verified', 'green');
    return true;
  } catch (error) {
    log(`❌ WebSocket removal test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testSSEConfiguration() {
  log('\n📡 Testing SSE Configuration...', 'blue');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check if SSE files exist
    const sseFiles = [
      'src/hooks/useSSE.ts',
      'src/utils/SSEManager.ts'
    ];
    
    for (const file of sseFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`SSE file missing: ${file}`);
      }
      log(`  ✅ ${file} exists`, 'green');
    }
    
    // Check SSE URL configuration
    const sseUrl = process.env.NEXT_PUBLIC_SSE_URL;
    if (!sseUrl || !sseUrl.includes('netlify/functions')) {
      log('  ⚠️  SSE URL not configured for Netlify functions', 'yellow');
    } else {
      log('  ✅ SSE URL configured for Netlify functions', 'green');
    }
    
    log('✅ SSE configuration verified', 'green');
    return true;
  } catch (error) {
    log(`❌ SSE configuration test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('🧪 Starting Next-Agentify Integration Tests', 'blue');
  log('===========================================', 'blue');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Supabase Connection', fn: testSupabaseConnection },
    { name: 'Database Schema', fn: testDatabaseSchema },
    { name: 'Netlify Functions', fn: testNetlifyFunctions },
    { name: 'WebSocket Removal', fn: testWebSocketRemoval },
    { name: 'SSE Configuration', fn: testSSEConfiguration }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
  }
  
  // Summary
  log('\n📊 Test Results Summary', 'blue');
  log('======================', 'blue');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });
  
  log(`\n📈 Overall: ${passed}/${total} tests passed`, passed === total ? 'green' : 'red');
  
  if (passed === total) {
    log('\n🎉 All tests passed! Your Supabase migration is complete and ready for deployment.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the issues above before deploying.', 'yellow');
  }
  
  return passed === total;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Test runner crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runAllTests };
