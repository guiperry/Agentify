#!/usr/bin/env node

/**
 * Test script for agent compilation
 * Tests the full Go compilation pipeline by starting the Next.js server and making API calls
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  agentConfig: {
    name: 'Test Agent',
    personality: 'helpful',
    instructions: 'You are a helpful test agent for validating the compilation process.',
    features: {
      chat: true,
      automation: false,
      analytics: false
    },
    settings: {
      mcpServers: [],
      creativity: 0.7
    }
  },
  advancedSettings: {
    isolationLevel: 'process',
    memoryLimit: 512,
    cpuCores: 1,
    timeLimit: 60,
    networkAccess: true,
    fileSystemAccess: false,
    useChromemGo: true,
    subAgentCapabilities: false
  },
  selectedPlatform: 'linux'
};

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/api/health`, (res) => {
          resolve(res);
        });
        req.on('error', reject);
        req.setTimeout(1000);
      });
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function testCompilationAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(TEST_CONFIG);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/compile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testCompilation() {
  console.log('🧪 Testing agent compilation via API...');

  let serverProcess = null;

  try {
    // Start the Next.js development server
    console.log('🚀 Starting Next.js development server...');
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    const serverReady = await waitForServer(3000);

    if (!serverReady) {
      throw new Error('Server failed to start within timeout');
    }

    console.log('✅ Server is ready');

    // Test the compilation API
    console.log('🔨 Testing compilation API...');
    const result = await testCompilationAPI();

    if (result.success) {
      console.log(`✅ Compilation successful!`);
      console.log(`📦 Plugin created at: ${result.pluginPath}`);
      console.log(`📝 Message: ${result.message}`);
      return true;
    } else {
      console.error(`❌ Compilation failed: ${result.message}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    // Clean up server process
    if (serverProcess) {
      console.log('🛑 Stopping server...');
      serverProcess.kill('SIGTERM');

      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }
  }
}


// Run the test if called directly
if (require.main === module) {
  testCompilation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCompilation };
