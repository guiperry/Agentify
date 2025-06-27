#!/usr/bin/env node

/**
 * Test script for WASM compilation
 * Tests the new WASM compilation functionality
 */

const http = require('http');
const { spawn } = require('child_process');

const TEST_CONFIG = {
  agentConfig: {
    name: "Test WASM Agent",
    personality: "A helpful test agent for WASM compilation",
    instructions: "You are a test agent compiled to WebAssembly.",
    features: {
      chat: true,
      automation: false,
      analytics: false,
      notifications: false
    },
    settings: {
      mcpServers: [],
      creativity: 0.7
    }
  },
  buildTarget: "wasm",
  advancedSettings: {
    isolationLevel: 'process',
    memoryLimit: 512,
    cpuCores: 1,
    timeLimit: 60,
    networkAccess: true,
    fileSystemAccess: false,
    useChromemGo: true,
    subAgentCapabilities: false
  }
};

async function waitForServer(port, maxWait = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/api/health`, (res) => {
          resolve(res.statusCode === 200);
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

async function testWasmCompilationAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(TEST_CONFIG);

    const options = {
      hostname: 'localhost',
      port: 3001,
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

async function testGoFallbackCompilation() {
  const goConfig = { ...TEST_CONFIG, buildTarget: "go" };
  const postData = JSON.stringify(goConfig);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
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

async function testWasmCompilation() {
  console.log('🧪 Testing WASM compilation via API...');

  try {
    // Check if server is running
    console.log('🔍 Checking if development server is running...');
    const serverReady = await waitForServer(3001);

    if (!serverReady) {
      console.log('❌ Development server not running on port 3001');
      console.log('💡 Please run "npm run dev" first');
      return;
    }

    console.log('✅ Development server is running');

    // Test WASM compilation
    console.log('🔧 Testing WASM compilation...');
    try {
      const wasmResult = await testWasmCompilationAPI();
      
      if (wasmResult.success) {
        console.log('✅ WASM compilation successful!');
        console.log(`📦 Output file: ${wasmResult.filename || wasmResult.outputFile || 'unknown'}`);
        console.log(`🔗 Download URL: ${wasmResult.downloadUrl || 'not provided'}`);
      } else {
        console.log('❌ WASM compilation failed:', wasmResult.message);
      }
    } catch (error) {
      console.log('❌ WASM compilation test failed:', error.message);
    }

    // Test Go fallback compilation
    console.log('🔧 Testing Go fallback compilation...');
    try {
      const goResult = await testGoFallbackCompilation();
      
      if (goResult.success) {
        console.log('✅ Go fallback compilation successful!');
        console.log(`📦 Output file: ${goResult.filename || goResult.outputFile || 'unknown'}`);
        console.log(`🔗 Download URL: ${goResult.downloadUrl || 'not provided'}`);
      } else {
        console.log('❌ Go fallback compilation failed:', goResult.message);
      }
    } catch (error) {
      console.log('❌ Go fallback compilation test failed:', error.message);
    }

    console.log('🎉 Compilation tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testWasmCompilation();
}

module.exports = {
  testWasmCompilation,
  testWasmCompilationAPI,
  testGoFallbackCompilation
};
