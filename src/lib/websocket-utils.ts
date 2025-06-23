// WebSocket utilities for server-side communication
// Note: This is for server-side use only (API routes)

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

// WebSocket client for server-side communication
class ServerWebSocketClient {
  private ws: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor() {
    // Only initialize if WebSocket is enabled and we're in a Node.js environment
    if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true') {
      this.connect();
    }
  }

  private async connect() {
    try {
      // Dynamic import for server-side WebSocket
      const WebSocket = (await import('ws')).default;
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        console.log('Server WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.ws.on('close', () => {
        console.log('Server WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect();
      });

      this.ws.on('error', (error: Error) => {
        console.error('Server WebSocket error:', error);
        this.isConnected = false;
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      
      setTimeout(() => {
        console.log(`Attempting to reconnect WebSocket (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, delay);
    }
  }

  public sendMessage(message: WebSocketMessage) {
    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
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
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
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

// Utility functions for sending updates
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
