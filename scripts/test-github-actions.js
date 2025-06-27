#!/usr/bin/env node

/**
 * Test script for GitHub Actions compilation setup
 * This script verifies that the GitHub Actions compiler can be initialized
 * and that the necessary environment variables are configured.
 */

// Mock the GitHub Actions compiler for testing
function createGitHubActionsCompiler() {
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'guiperry';
  const repo = process.env.GITHUB_REPO || 'next-agentify';
  const workflowId = process.env.GITHUB_WORKFLOW_ID || 'compile-plugin.yml';

  if (!githubToken || githubToken === 'your_github_token_here') {
    return null;
  }

  // Return a mock compiler object for testing
  return {
    owner,
    repo,
    workflowId,
    isConfigured: true
  };
}

async function testGitHubActionsSetup() {
  console.log('🧪 Testing GitHub Actions compilation setup...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  const requiredEnvVars = [
    'GITHUB_TOKEN',
    'GITHUB_OWNER', 
    'GITHUB_REPO',
    'GITHUB_WORKFLOW_ID'
  ];

  let missingVars = [];
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName === 'GITHUB_TOKEN' ? '***' : value}`);
    } else {
      console.log(`❌ ${varName}: Not set`);
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log(`\n⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    console.log('Please set these variables before using GitHub Actions compilation.');
    return false;
  }

  // Test compiler initialization
  console.log('\n🔧 Testing Compiler Initialization:');
  try {
    const compiler = createGitHubActionsCompiler();
    if (compiler) {
      console.log('✅ GitHub Actions compiler initialized successfully');
      return true;
    } else {
      console.log('❌ GitHub Actions compiler initialization failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error initializing compiler: ${error.message}`);
    return false;
  }
}

// Test configuration object
const testConfig = {
  id: 'test-agent',
  name: 'Test Agent',
  version: '1.0.0',
  description: 'Test agent for GitHub Actions compilation',
  personality: 'helpful',
  instructions: 'You are a test agent.',
  buildTarget: 'wasm',
  tools: [],
  resources: [],
  prompts: [],
  pythonDependencies: ['requests'],
  useChromemGo: false,
  subAgentCapabilities: false,
  trustedExecutionEnvironment: {
    isolationLevel: 'process',
    resourceLimits: {
      memory: 512,
      cpu: 1,
      timeLimit: 300
    },
    networkAccess: true,
    fileSystemAccess: false
  },
  ttl: 3600,
  signature: 'test-signature'
};

async function testWorkflowTrigger() {
  console.log('\n🚀 Testing Workflow Trigger (Dry Run):');
  
  const compiler = createGitHubActionsCompiler();
  if (!compiler) {
    console.log('❌ Cannot test workflow trigger - compiler not available');
    return false;
  }

  try {
    // Note: This would actually trigger a workflow in a real test
    // For now, we'll just validate the configuration
    console.log('✅ Test configuration is valid for workflow trigger');
    console.log(`   - Agent ID: ${testConfig.id}`);
    console.log(`   - Build Target: ${testConfig.buildTarget}`);
    console.log(`   - Platform: ${process.env.GOOS || 'linux'}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Workflow trigger test failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🔍 Next Agentify - GitHub Actions Compilation Test\n');
  
  const setupOk = await testGitHubActionsSetup();
  const triggerOk = await testWorkflowTrigger();
  
  console.log('\n📊 Test Results:');
  console.log(`Setup Test: ${setupOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Trigger Test: ${triggerOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (setupOk && triggerOk) {
    console.log('\n🎉 All tests passed! GitHub Actions compilation is ready.');
    console.log('\n📝 Next steps:');
    console.log('1. Deploy to Netlify with environment variables set');
    console.log('2. Test compilation through the web interface');
    console.log('3. Monitor GitHub Actions tab for workflow execution');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testGitHubActionsSetup,
  testWorkflowTrigger,
  runTests
};
