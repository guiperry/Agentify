'use client';

import { SSEClient } from './sseClient';

export interface SSEMessage {
  type: string;
  data?: any;
  timestamp: string;
}

export interface CompilationUpdate {
  step: string;
  progress: number;
  message: string;
  status: 'in_progress' | 'completed' | 'error' | 'waiting';
  tab?: string;
}

export interface DeploymentUpdate {
  deploymentId: string;
  status: string;
  progress: number;
  message: string;
}

// Singleton SSE manager to maintain single connection
export class SSEManager {
  private static instance: SSEManager | null = null;
  private sseClient: InstanceType<typeof SSEClient> | null = null;
  private isConnected = false;
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2; // Reduced from 5 to prevent excessive reconnection attempts
  private listeners = new Set<(message: SSEMessage) => void>();
  private statusListeners = new Set<(status: { isConnected: boolean; connectionStatus: string }) => void>();
  private isConnecting = false;
  private isBrowser = typeof window !== 'undefined';

  private constructor() {}

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  addListener(listener: (message: SSEMessage) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (message: SSEMessage) => void) {
    this.listeners.delete(listener);
  }

  addStatusListener(listener: (status: { isConnected: boolean; connectionStatus: string }) => void) {
    this.statusListeners.add(listener);
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

  connect(authToken?: string) {
    // Don't attempt to connect if not in browser, already connecting, or already have a client
    if (!this.isBrowser) {
      console.log('Not in browser environment - using local deployment tracking only');
      return;
    }
    if (this.isConnecting) {
      console.log('SSE connection already in progress, ignoring duplicate connect call');
      return;
    }
    if (this.sseClient) {
      console.log('SSE client already exists, ignoring duplicate connect call');
      return;
    }
    
    // Check if we've reached max reconnect attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached, not attempting to connect');
      return;
    }

    // Determine the correct SSE endpoint based on environment
    // In Netlify, we need to use /.netlify/functions/stream instead of /api/stream
    const isNetlify = typeof window !== 'undefined' && 
      (window.location.hostname.includes('netlify.app') || 
       window.location.hostname.includes('agentify-nextjs.netlify.app'));
    
    const baseUrl = process.env.NEXT_PUBLIC_SSE_URL || 
      (isNetlify ? '/.netlify/functions/stream' : '/api/stream');
    
    console.log(`Using SSE endpoint: ${baseUrl} (Netlify environment: ${isNetlify})`);
    const sseUrl = authToken ? `${baseUrl}?token=${authToken}` : baseUrl;

    try {
      this.isConnecting = true;
      this.connectionStatus = 'connecting';
      this.notifyStatusListeners();
      console.log(`Attempting to connect to SSE endpoint: ${baseUrl}`);

      this.sseClient = new SSEClient(sseUrl);
      
      this.sseClient.on('open', () => {
        console.log('SSE connection established successfully');
        this.isConnected = true;
        this.isConnecting = false;
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.notifyStatusListeners();
      });

      this.sseClient.on('error', (err: any) => {
        console.error('SSE connection error:', err);
        this.isConnecting = false;
        this.connectionStatus = 'error';
        this.notifyStatusListeners();
        
        // Clean up the client on error
        if (this.sseClient) {
          this.sseClient = null;
        }
        
        this.handleReconnect();
      });

      this.sseClient.on('close', () => {
        console.log('SSE connection closed');
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionStatus = 'disconnected';
        this.notifyStatusListeners();
        
        // Clean up the client on close
        this.sseClient = null;
        
        this.handleReconnect();
      });

      // Forward all message types to listeners
      this.sseClient.on('*', (data: { type: string; data?: any }) => {
        const message: SSEMessage = {
          type: data.type,
          data: data.data,
          timestamp: new Date().toISOString()
        };
        this.listeners.forEach(listener => listener(message));
      });

      this.sseClient.connect();
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      this.isConnecting = false;
      this.connectionStatus = 'error';
      this.sseClient = null;
      this.notifyStatusListeners();
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    // Only attempt to reconnect if we have listeners and haven't exceeded max attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.listeners.size > 0) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      this.reconnectAttempts++;
      console.log(`SSE reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      this.reconnectTimeout = setTimeout(() => {
        // Check if we still have listeners before attempting to reconnect
        if (this.listeners.size > 0) {
          this.connect();
        } else {
          console.log('No active SSE listeners, canceling reconnection attempts');
          this.reconnectAttempts = this.maxReconnectAttempts; // Stop further attempts
        }
      }, delay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum SSE reconnection attempts reached, giving up');
      // Reset connection state to avoid further attempts
      this.isConnected = false;
      this.isConnecting = false;
      this.connectionStatus = 'disconnected';
      this.sseClient = null;
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.sseClient) {
      this.sseClient.close();
      this.sseClient = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.notifyStatusListeners();
  }

  cleanup() {
    // Disconnect if there are no active listeners
    if (this.listeners.size === 0 && this.statusListeners.size === 0) {
      console.log('No active SSE listeners, disconnecting');
      this.disconnect();
      
      // Reset reconnection attempts to prevent further connection attempts
      this.reconnectAttempts = this.maxReconnectAttempts;
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionStatus: this.connectionStatus
    };
  }
}