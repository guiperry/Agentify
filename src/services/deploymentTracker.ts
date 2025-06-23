export interface DeploymentStatus {
  id: string;
  agentName: string;
  version: string;
  status: 'pending' | 'deploying' | 'testing' | 'success' | 'failed' | 'rollback';
  progress: number;
  startTime: Date;
  endTime?: Date;
  environment: 'development' | 'staging' | 'production';
  logs: DeploymentLog[];
  metrics?: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export interface DeploymentLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface WebhookPayload {
  deploymentId: string;
  status: DeploymentStatus['status'];
  progress: number;
  message: string;
  timestamp: string;
}

// Import the WebSocket manager to avoid creating duplicate connections
import { WebSocketManager } from '../hooks/useWebSocket';

class DeploymentTracker {
  private deployments = new Map<string, DeploymentStatus>();
  private listeners = new Set<(deployment: DeploymentStatus) => void>();
  private wsManager: WebSocketManager | null = null;
  private messageListener: ((message: any) => void) | null = null;

  constructor() {
    // Only initialize WebSocket if explicitly enabled and in browser environment
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true') {
      this.initializeWebSocket();
    } else {
      console.log('WebSocket disabled or not in browser environment - using local deployment tracking only');
    }
  }

  private initializeWebSocket() {
    try {
      // Use the singleton WebSocket manager instead of creating a new connection
      this.wsManager = WebSocketManager.getInstance();

      // Create a message listener for deployment updates
      this.messageListener = (message: any) => {
        if (message.type === 'deployment_update') {
          this.handleWebhookUpdate(message.data);
        }
      };

      this.wsManager.addListener(this.messageListener);
      console.log('Deployment tracker connected to WebSocket manager');
    } catch (error) {
      console.error('Failed to initialize WebSocket for deployment tracker:', error);
    }
  }

  private handleWebhookUpdate(payload: WebhookPayload) {
    const deployment = this.deployments.get(payload.deploymentId);
    if (deployment) {
      deployment.status = payload.status;
      deployment.progress = payload.progress;
      deployment.logs.push({
        timestamp: new Date(payload.timestamp),
        level: 'info',
        message: payload.message
      });

      if (payload.status === 'success' || payload.status === 'failed') {
        deployment.endTime = new Date(payload.timestamp);
      }

      this.notifyListeners(deployment);
    }
  }

  async startDeployment(agentName: string, version: string, environment: DeploymentStatus['environment']): Promise<string> {
    const deploymentId = crypto.randomUUID();
    
    const deployment: DeploymentStatus = {
      id: deploymentId,
      agentName,
      version,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      environment,
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: 'Deployment initiated'
      }]
    };

    this.deployments.set(deploymentId, deployment);
    
    try {
      // Call deployment API
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentId,
          agentName,
          version,
          environment
        }),
      });

      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }

      deployment.status = 'deploying';
      deployment.progress = 10;
      deployment.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Deployment started'
      });

      this.notifyListeners(deployment);
    } catch (error) {
      deployment.status = 'failed';
      deployment.endTime = new Date();
      deployment.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      this.notifyListeners(deployment);
    }

    return deploymentId;
  }

  async rollbackDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    deployment.status = 'rollback';
    deployment.logs.push({
      timestamp: new Date(),
      level: 'warning',
      message: 'Rollback initiated'
    });

    this.notifyListeners(deployment);

    try {
      const response = await fetch(`/api/deploy/${deploymentId}/rollback`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Rollback failed: ${response.statusText}`);
      }
    } catch (error) {
      deployment.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      this.notifyListeners(deployment);
    }
  }

  getDeployment(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  getAllDeployments(): DeploymentStatus[] {
    return Array.from(this.deployments.values()).sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime()
    );
  }

  getActiveDeployments(): DeploymentStatus[] {
    return this.getAllDeployments().filter(
      d => d.status === 'pending' || d.status === 'deploying' || d.status === 'testing'
    );
  }

  subscribe(listener: (deployment: DeploymentStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(deployment: DeploymentStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(deployment);
      } catch (error) {
        console.error('Error in deployment listener:', error);
      }
    });
  }

  // Mock deployment for development
  async mockDeployment(agentName: string, version: string, environment: DeploymentStatus['environment']): Promise<string> {
    const deploymentId = crypto.randomUUID();
    
    const deployment: DeploymentStatus = {
      id: deploymentId,
      agentName,
      version,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      environment,
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: 'Mock deployment initiated'
      }]
    };

    this.deployments.set(deploymentId, deployment);
    this.notifyListeners(deployment);

    // Simulate deployment progress
    const steps = [
      { status: 'deploying' as const, progress: 20, message: 'Building agent package' },
      { status: 'deploying' as const, progress: 40, message: 'Uploading to server' },
      { status: 'deploying' as const, progress: 60, message: 'Installing dependencies' },
      { status: 'testing' as const, progress: 80, message: 'Running health checks' },
      { status: 'success' as const, progress: 100, message: 'Deployment completed successfully' }
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      
      const step = steps[i];
      deployment.status = step.status;
      deployment.progress = step.progress;
      deployment.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: step.message
      });

      if (step.status === 'success') {
        deployment.endTime = new Date();
        deployment.metrics = {
          responseTime: 0.8 + Math.random() * 0.4,
          errorRate: Math.random() * 0.5,
          throughput: 1000 + Math.random() * 500
        };
      }

      this.notifyListeners(deployment);
    }

    return deploymentId;
  }

  disconnect() {
    if (this.wsManager && this.messageListener) {
      this.wsManager.removeListener(this.messageListener);
      this.messageListener = null;
      this.wsManager = null;
    }
    this.listeners.clear();
  }
}

export const deploymentTracker = new DeploymentTracker();
