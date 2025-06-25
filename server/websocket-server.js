const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Create HTTP server with basic routing for WebSocket triggers
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle compilation update endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/broadcast/compilation') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        broadcastCompilationUpdate(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Compilation update broadcasted' }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Handle deployment update endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/broadcast/deployment') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        broadcastDeploymentUpdate(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Deployment update broadcasted' }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws, request) => {
  console.log('New WebSocket connection established');
  clients.add(ws);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to deployment tracker WebSocket',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received WebSocket message:', message);

      // Handle process configuration request
      if (message.type === 'start_process_configuration') {
        console.log('🚀 Starting Process Configuration workflow');
        startProcessConfiguration(message.data);
      } else {
        // Echo other messages back for now
        ws.send(JSON.stringify({
          type: 'echo',
          originalMessage: message,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to broadcast deployment updates to all connected clients
function broadcastDeploymentUpdate(payload) {
  const message = JSON.stringify({
    type: 'deployment_update',
    ...payload,
    timestamp: new Date().toISOString()
  });

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Function to broadcast compilation updates to all connected clients
function broadcastCompilationUpdate(payload) {
  const message = JSON.stringify({
    type: 'compilation_update',
    ...payload,
    timestamp: new Date().toISOString()
  });

  console.log(`📤 Broadcasting to ${clients.size} clients:`, payload);

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      console.log(`✅ Sent update to client`);
    } else {
      console.log(`❌ Client not ready, state: ${client.readyState}`);
    }
  });
}

// Process Configuration workflow with step-by-step animation (cloned from mock implementation)
async function startProcessConfiguration(config) {
  console.log('🔄 Starting Process Configuration with config:', config?.name);

  const steps = [
    { id: 'validate', name: 'Validating Configuration', tab: 'identity' },
    { id: 'api-keys', name: 'Configuring API Keys', tab: 'api-keys' },
    { id: 'analyze', name: 'Analyzing Repository', tab: 'personality' },
    { id: 'capabilities', name: 'Processing Capabilities', tab: 'capabilities' },
    { id: 'compile', name: 'Compiling Agent', tab: 'compile' }
  ];

  try {
    // Send initial start message
    broadcastCompilationUpdate({
      step: 'initialization',
      progress: 0,
      message: 'Starting configuration processing...',
      status: 'in_progress'
    });

    // Process steps up to but not including compile (exactly like mock)
    for (let i = 0; i < steps.length - 1; i++) {
      const step = steps[i];
      console.log(`🔄 Processing step ${i + 1}/${steps.length}: ${step.name}`);

      // Start step - set to in_progress status
      broadcastCompilationUpdate({
        step: step.id,
        progress: 0,
        message: `Processing ${step.name.toLowerCase()}...`,
        status: 'in_progress',
        tab: step.tab
      });

      // Simulate processing time (like mock: 1000 + Math.random() * 2000)
      await delay(1000 + Math.random() * 2000);

      // Complete step
      broadcastCompilationUpdate({
        step: step.id,
        progress: 100,
        message: `${step.name} completed successfully`,
        status: 'completed',
        tab: step.tab
      });

      console.log(`✅ Completed step: ${step.name}`);
    }

    // Start compile step but don't complete it automatically (exactly like mock)
    const compileStep = steps[steps.length - 1];
    console.log(`� Starting compile step: ${compileStep.name}`);

    // Set compile step to in_progress status with pause message (exactly like mock)
    broadcastCompilationUpdate({
      step: compileStep.id,
      progress: 0,
      message: 'Ready for compilation. Please use the Compile button in the Compiler Logs tab.',
      status: 'in_progress',
      tab: compileStep.tab
    });

    console.log('🔧 Process Configuration paused at compile step for manual compilation');

    // Return partial result - compile step will be completed externally (like mock)
    // Note: We don't send a completion message here, the process is intentionally incomplete

  } catch (error) {
    console.error('❌ Process Configuration failed:', error);

    broadcastCompilationUpdate({
      step: 'error',
      progress: 0,
      message: `Processing error: ${error.message}`,
      status: 'error'
    });
  }
}

// Helper function for delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock deployment updates for testing (disabled to prevent console errors)
function startMockDeploymentUpdates() {
  // Disabled mock deployment updates to prevent interference with Process Configuration
  console.log('Mock deployment updates disabled');
}

// Start the server
const PORT = process.env.WS_PORT || 3002;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
  
  // Start mock updates for testing
  startMockDeploymentUpdates();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing WebSocket server...');
  wss.close(() => {
    server.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing WebSocket server...');
  wss.close(() => {
    server.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });
});

// Export for potential use in other modules
module.exports = {
  wss,
  broadcastDeploymentUpdate,
  broadcastCompilationUpdate,
  clients
};
