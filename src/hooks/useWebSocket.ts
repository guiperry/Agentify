'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
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

interface UseWebSocketOptions {
  onCompilationUpdate?: (update: CompilationUpdate) => void;
  onDeploymentUpdate?: (update: DeploymentUpdate) => void;
  onMessage?: (message: WebSocketMessage) => void;
  autoConnect?: boolean;
}

// Singleton WebSocket manager to prevent multiple connections and race conditions
class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners = new Set<(message: WebSocketMessage) => void>();
  private statusListeners = new Set<(status: { isConnected: boolean; connectionStatus: string }) => void>();
  private isConnecting = false; // Prevent multiple simultaneous connection attempts
  private isBrowser = typeof window !== 'undefined'; // Check if we're in browser environment

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  addListener(listener: (message: WebSocketMessage) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (message: WebSocketMessage) => void) {
    this.listeners.delete(listener);
  }

  addStatusListener(listener: (status: { isConnected: boolean; connectionStatus: string }) => void) {
    this.statusListeners.add(listener);
    // Immediately notify with current status
    listener({ isConnected: this.isConnected, connectionStatus: this.connectionStatus });
  }

  removeStatusListener(listener: (status: { isConnected: boolean; connectionStatus: string }) => void) {
    this.statusListeners.delete(listener);
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach(listener => {
      listener({ isConnected: this.isConnected, connectionStatus: this.connectionStatus });
    });
  }

  connect() {
    // Only connect if we're in a browser environment
    if (!this.isBrowser) {
      console.log('WebSocket not available in server environment');
      return;
    }

    if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== 'true') {
      console.log('WebSocket disabled, NEXT_PUBLIC_ENABLE_WEBSOCKET =', process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET);
      return;
    }

    // Check if WebSocket is available in the browser
    if (typeof WebSocket === 'undefined') {
      console.log('WebSocket not supported in this environment');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    // Don't reconnect if already connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Don't reconnect if currently connecting
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

    try {
      console.log('Establishing WebSocket connection to:', wsUrl);
      this.isConnecting = true;
      this.connectionStatus = 'connecting';
      this.notifyStatusListeners();

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnected = true;
        this.isConnecting = false;
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.notifyStatusListeners();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.listeners.forEach(listener => listener(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionStatus = 'disconnected';
        this.notifyStatusListeners();

        // Only attempt to reconnect if we have active listeners and haven't exceeded max attempts
        if (this.listeners.size > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.pow(2, this.reconnectAttempts) * 1000;
          this.reconnectAttempts++;

          console.log(`Scheduling WebSocket reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('Max reconnection attempts reached, giving up');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.connectionStatus = 'error';
        this.notifyStatusListeners();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.connectionStatus = 'error';
      this.notifyStatusListeners();
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0; // Reset reconnect attempts on manual disconnect
    this.notifyStatusListeners();
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, cannot send message');
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionStatus: this.connectionStatus
    };
  }

  // Clean up when no more listeners
  cleanup() {
    if (this.listeners.size === 0 && this.statusListeners.size === 0) {
      this.disconnect();
    }
  }
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onCompilationUpdate,
    onDeploymentUpdate,
    onMessage,
    autoConnect = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsManager = useRef<WebSocketManager>(WebSocketManager.getInstance());
  const messageListenerRef = useRef<((message: WebSocketMessage) => void) | null>(null);
  const statusListenerRef = useRef<((status: { isConnected: boolean; connectionStatus: string }) => void) | null>(null);

  // Create message listener
  useEffect(() => {
    const messageListener = (message: WebSocketMessage) => {
      // Call the general message handler
      onMessage?.(message);

      // Handle specific message types
      switch (message.type) {
        case 'compilation_update':
          onCompilationUpdate?.(message.data);
          break;
        case 'deployment_update':
          onDeploymentUpdate?.(message.data);
          break;
        case 'connection':
          console.log('WebSocket connection confirmed:', message);
          break;
        default:
          console.log('Received WebSocket message:', message);
      }
    };

    messageListenerRef.current = messageListener;
    wsManager.current.addListener(messageListener);

    return () => {
      if (messageListenerRef.current) {
        wsManager.current.removeListener(messageListenerRef.current);
        messageListenerRef.current = null;
      }
    };
  }, [onCompilationUpdate, onDeploymentUpdate, onMessage]);

  // Create status listener
  useEffect(() => {
    const statusListener = (status: { isConnected: boolean; connectionStatus: string }) => {
      setIsConnected(status.isConnected);
      setConnectionStatus(status.connectionStatus as 'connecting' | 'connected' | 'disconnected' | 'error');
    };

    statusListenerRef.current = statusListener;
    wsManager.current.addStatusListener(statusListener);

    return () => {
      if (statusListenerRef.current) {
        wsManager.current.removeStatusListener(statusListenerRef.current);
        statusListenerRef.current = null;
      }
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      wsManager.current.connect();
    }

    return () => {
      // Clean up the manager if no more listeners
      wsManager.current.cleanup();
    };
  }, [autoConnect]);

  const connect = useCallback(() => {
    wsManager.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsManager.current.disconnect();
  }, []);

  const sendMessage = useCallback((message: any) => {
    wsManager.current.sendMessage(message);
  }, []);

  // Send compilation update
  const sendCompilationUpdate = useCallback((update: CompilationUpdate) => {
    sendMessage({
      type: 'compilation_update',
      data: update,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  // Send deployment update
  const sendDeploymentUpdate = useCallback((update: DeploymentUpdate) => {
    sendMessage({
      type: 'deployment_update',
      data: update,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    sendCompilationUpdate,
    sendDeploymentUpdate
  };
}

export type { CompilationUpdate, DeploymentUpdate, WebSocketMessage };
export { WebSocketManager };
