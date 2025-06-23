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
      
      // Echo the message back for now
      ws.send(JSON.stringify({
        type: 'echo',
        originalMessage: message,
        timestamp: new Date().toISOString()
      }));
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

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Mock deployment updates for testing
function startMockDeploymentUpdates() {
  setInterval(() => {
    if (clients.size > 0) {
      broadcastDeploymentUpdate({
        deploymentId: 'mock-deployment-' + Date.now(),
        status: 'deploying',
        progress: Math.floor(Math.random() * 100),
        message: 'Mock deployment progress update'
      });
    }
  }, 10000); // Send update every 10 seconds if clients are connected
}

// Start the server
const PORT = process.env.WS_PORT || 3001;
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
