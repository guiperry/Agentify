// WebSocket utilities for server-side communication
// Note: This is for server-side use only (API routes)
// Disabled for serverless deployment compatibility

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface CompilationUpdate {
  step: string;
  progress: number;
  message: string;
  status: 'in_progress' | 'completed' | 'error';
}

interface DeploymentUpdate {
  deploymentId: string;
  status: string;
  progress: number;
  message: string;
}

// Stub WebSocket client for serverless environments
class ServerWebSocketClient {
  private isConnected = false;

  constructor() {
    // WebSocket disabled for serverless deployment
    console.log('Server WebSocket disabled for serverless deployment');
  }

  public sendMessage(message: WebSocketMessage) {
    // Stub implementation for serverless environment
    console.log('WebSocket message (not sent in serverless):', message);
  }

  public sendCompilationUpdate(update: CompilationUpdate) {
    this.sendMessage({
      type: 'compilation_update',
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  public sendDeploymentUpdate(update: DeploymentUpdate) {
    this.sendMessage({
      type: 'deployment_update',
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  public disconnect() {
    // Stub implementation for serverless environment
    console.log('WebSocket disconnect (no-op in serverless)');
  }
}

// Singleton instance for server-side use
let serverWebSocketClient: ServerWebSocketClient | null = null;

export function getServerWebSocketClient(): ServerWebSocketClient {
  if (!serverWebSocketClient) {
    serverWebSocketClient = new ServerWebSocketClient();
  }
  return serverWebSocketClient;
}

// Utility functions for sending updates (stub implementations for serverless)
export function sendCompilationUpdate(step: string, progress: number, message: string, status: 'in_progress' | 'completed' | 'error' = 'in_progress') {
  const client = getServerWebSocketClient();
  client.sendCompilationUpdate({
    step,
    progress,
    message,
    status
  });
}

export function sendDeploymentUpdate(deploymentId: string, status: string, progress: number, message: string) {
  const client = getServerWebSocketClient();
  client.sendDeploymentUpdate({
    deploymentId,
    status,
    progress,
    message
  });
}

// Types for export
export type { CompilationUpdate, DeploymentUpdate, WebSocketMessage };
