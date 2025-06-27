'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SSEManager } from '../utils/SSEManager';
import type { CompilationUpdate, DeploymentUpdate, SSEMessage } from '../utils/SSEManager';
import { useAuth } from '../contexts/AuthContext';

interface UseSSEOptions {
  onCompilationUpdate?: (update: CompilationUpdate) => void;
  onDeploymentUpdate?: (update: DeploymentUpdate) => void;
  onMessage?: (message: SSEMessage) => void;
  autoConnect?: boolean;
}

export function useSSE(options: UseSSEOptions = {}) {
  const {
    onCompilationUpdate,
    onDeploymentUpdate,
    onMessage,
    autoConnect = true
  } = options;

  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const sseManager = useRef<SSEManager>(SSEManager.getInstance());
  const messageListenerRef = useRef<((message: SSEMessage) => void) | null>(null);
  const statusListenerRef = useRef<((status: { isConnected: boolean; connectionStatus: string }) => void) | null>(null);

  // Create message listener
  useEffect(() => {
    const messageListener = (message: SSEMessage) => {
      onMessage?.(message);

      switch (message.type) {
        case 'compilation_update':
          const compilationData = message.data || {
            step: (message as any).step,
            progress: (message as any).progress,
            message: (message as any).message,
            status: (message as any).status,
            tab: (message as any).tab
          };
          onCompilationUpdate?.(compilationData);
          break;
        case 'deployment_update':
          const deploymentData = message.data || {
            deploymentId: (message as any).deploymentId,
            status: (message as any).status,
            progress: (message as any).progress,
            message: (message as any).message
          };
          onDeploymentUpdate?.(deploymentData);
          break;
        case 'connection':
          console.log('SSE connection confirmed:', message);
          break;
        default:
          console.log('Received SSE message:', message);
      }
    };

    messageListenerRef.current = messageListener;
    sseManager.current.addListener(messageListener);

    return () => {
      if (messageListenerRef.current) {
        sseManager.current.removeListener(messageListenerRef.current);
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
    sseManager.current.addStatusListener(statusListener);

    return () => {
      if (statusListenerRef.current) {
        sseManager.current.removeStatusListener(statusListenerRef.current);
        statusListenerRef.current = null;
      }
    };
  }, []);

  // Auto-connect on mount when user is authenticated
  useEffect(() => {
    if (autoConnect && user?.access_token) {
      sseManager.current.connect(user.access_token);
    }

    return () => {
      sseManager.current.cleanup();
    };
  }, [autoConnect, user?.access_token]);

  const connect = useCallback(() => {
    sseManager.current.connect(user?.access_token);
  }, [user?.access_token]);

  const disconnect = useCallback(() => {
    sseManager.current.disconnect();
  }, []);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect
  };
}

export type { CompilationUpdate, DeploymentUpdate, SSEMessage };