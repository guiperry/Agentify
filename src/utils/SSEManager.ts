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
  private maxReconnectAttempts = 5;
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

  connect() {
    if (!this.isBrowser) return;
    if (this.isConnecting) return;
    if (this.sseClient) return;

    const sseUrl = process.env.NEXT_PUBLIC_SSE_URL || '/.netlify/functions/stream';

    try {
      this.isConnecting = true;
      this.connectionStatus = 'connecting';
      this.notifyStatusListeners();

      this.sseClient = new SSEClient(sseUrl);
      
      this.sseClient.on('open', () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.notifyStatusListeners();
      });

      this.sseClient.on('error', () => {
        this.isConnecting = false;
        this.connectionStatus = 'error';
        this.notifyStatusListeners();
        this.handleReconnect();
      });

      this.sseClient.on('close', () => {
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionStatus = 'disconnected';
        this.notifyStatusListeners();
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
      this.notifyStatusListeners();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.listeners.size > 0) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      this.reconnectAttempts++;
      this.reconnectTimeout = setTimeout(() => this.connect(), delay);
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
    if (this.listeners.size === 0 && this.statusListeners.size === 0) {
      this.disconnect();
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionStatus: this.connectionStatus
    };
  }
}