import { AgentConfiguration, AgentFacts } from '@/components/AgentConfig';

export interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  duration?: number;
}

export interface ProcessingResult {
  success: boolean;
  steps: ProcessingStep[];
  compiledAgent?: {
    id: string;
    name: string;
    version: string;
    size: number;
    checksum: string;
  };
  errors?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

class ConfigurationService {
  private baseUrl = '/api'; // Always use relative URLs

  async validateAgentFacts(agentFacts: AgentFacts): Promise<ValidationResult> {
    // Use mock validation for development, real API for production
    const useRealBackend = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_USE_REAL_BACKEND === 'true';

    if (!useRealBackend) {
      return this.mockValidateAgentFacts(agentFacts);
    }

    try {
      const response = await fetch(`${this.baseUrl}/agent/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentFacts }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Validation error:', error);
      // Fall back to mock validation if API fails
      return this.mockValidateAgentFacts(agentFacts);
    }
  }

  // Mock validation for development
  private mockValidateAgentFacts(agentFacts: AgentFacts): ValidationResult {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // Basic validation - more lenient for development
    if (!agentFacts.agent_name || agentFacts.agent_name.trim().length < 3) {
      errors.agent_name = 'Agent name must be at least 3 characters long';
    }

    // Check if ID exists and is reasonable (don't require strict UUID format in dev)
    if (!agentFacts.id || agentFacts.id.trim().length < 10) {
      warnings.id = 'Agent ID should be a proper UUID in production';
    }

    // Basic capability checks
    if (!agentFacts.capabilities?.modalities || agentFacts.capabilities.modalities.length === 0) {
      warnings.modalities = 'Consider adding modalities to capabilities';
    }

    if (!agentFacts.capabilities?.skills || agentFacts.capabilities.skills.length === 0) {
      warnings.skills = 'Consider adding skills to capabilities';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  async processConfiguration(
    config: AgentConfiguration,
    repoUrl: string,
    onProgress?: (step: ProcessingStep) => void
  ): Promise<ProcessingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/agent/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          repoUrl,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      // Handle streaming response for real-time progress updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result: ProcessingResult = {
        success: false,
        steps: []
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'step_update' && onProgress) {
                onProgress(data.step);
              } else if (data.type === 'final_result') {
                result = data.result;
              }
            } catch (e) {
              // Ignore malformed JSON lines
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Processing error:', error);
      return {
        success: false,
        steps: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  async compileAgent(config: AgentConfiguration): Promise<{
    success: boolean;
    compiledAgent?: any;
    logs: string[];
    errors?: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/agent/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error(`Compilation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Compilation error:', error);
      return {
        success: false,
        logs: [],
        errors: [error instanceof Error ? error.message : 'Compilation failed']
      };
    }
  }

  async testAgent(config: AgentConfiguration, repoUrl: string): Promise<{
    success: boolean;
    testResults: {
      passed: number;
      failed: number;
      total: number;
      coverage: number;
      details: Array<{
        name: string;
        status: 'passed' | 'failed';
        duration: number;
        error?: string;
      }>;
    };
    logs: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/agent/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config, repoUrl }),
      });

      if (!response.ok) {
        throw new Error(`Testing failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Testing error:', error);
      return {
        success: false,
        testResults: {
          passed: 0,
          failed: 1,
          total: 1,
          coverage: 0,
          details: [{
            name: 'Connection Test',
            status: 'failed',
            duration: 0,
            error: error instanceof Error ? error.message : 'Testing failed'
          }]
        },
        logs: []
      };
    }
  }

  async getRepositoryAnalysis(repoUrl: string): Promise<{
    success: boolean;
    analysis?: {
      language: string;
      framework: string;
      dependencies: string[];
      complexity: 'low' | 'medium' | 'high';
      testCoverage: number;
      codeQuality: number;
      securityScore: number;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/repository/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Repository analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  // Mock implementation for development
  async mockProcessConfiguration(
    config: AgentConfiguration,
    repoUrl: string,
    onProgress?: (step: ProcessingStep) => void
  ): Promise<ProcessingResult> {
    console.log('Mock processing started with config:', config);
    console.log('Repository URL:', repoUrl);

    const steps: ProcessingStep[] = [
      { id: 'validate', name: 'Validating Configuration', status: 'pending', progress: 0 },
      { id: 'api-keys', name: 'Configuring API Keys', status: 'pending', progress: 0 },
      { id: 'analyze', name: 'Analyzing Repository', status: 'pending', progress: 0 },
      { id: 'capabilities', name: 'Processing Capabilities', status: 'pending', progress: 0 },
      { id: 'compile', name: 'Compiling Agent', status: 'pending', progress: 0 },
      { id: 'test', name: 'Running Tests', status: 'pending', progress: 0 },
      { id: 'package', name: 'Packaging Agent', status: 'pending', progress: 0 }
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`Starting step ${i + 1}/${steps.length}: ${step.name}`);

        step.status = 'running';
        step.message = `Processing ${step.name.toLowerCase()}...`;
        onProgress?.(step);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        step.status = 'completed';
        step.progress = 100;
        step.duration = Math.floor(1000 + Math.random() * 2000);
        step.message = `${step.name} completed successfully`;
        onProgress?.(step);

        console.log(`Completed step: ${step.name}`);
      }

      const result = {
        success: true,
        steps,
        compiledAgent: {
          id: crypto.randomUUID(),
          name: config.name,
          version: '1.0.0',
          size: Math.floor(1024 * 1024 * (2 + Math.random() * 3)), // 2-5 MB
          checksum: 'sha256:' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
        }
      };

      console.log('Mock processing completed successfully:', result);
      return result;
    } catch (error) {
      console.error('Mock processing failed:', error);
      return {
        success: false,
        steps,
        errors: [error instanceof Error ? error.message : 'Mock processing failed']
      };
    }
  }

  // Mock implementation that pauses at compile step for manual compilation
  async mockProcessConfigurationWithCompilePause(
    config: AgentConfiguration,
    repoUrl: string,
    onProgress?: (step: ProcessingStep) => void
  ): Promise<ProcessingResult> {
    console.log('Mock processing with compile pause started with config:', config);
    console.log('Repository URL:', repoUrl);

    const steps: ProcessingStep[] = [
      { id: 'validate', name: 'Validating Configuration', status: 'pending', progress: 0 },
      { id: 'api-keys', name: 'Configuring API Keys', status: 'pending', progress: 0 },
      { id: 'analyze', name: 'Analyzing Repository', status: 'pending', progress: 0 },
      { id: 'capabilities', name: 'Processing Capabilities', status: 'pending', progress: 0 },
      { id: 'compile', name: 'Compiling Agent', status: 'pending', progress: 0 }
    ];

    try {
      // Process steps up to but not including compile
      for (let i = 0; i < steps.length - 1; i++) {
        const step = steps[i];
        console.log(`Starting step ${i + 1}/${steps.length}: ${step.name}`);

        step.status = 'running';
        step.message = `Processing ${step.name.toLowerCase()}...`;
        onProgress?.(step);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        step.status = 'completed';
        step.progress = 100;
        step.duration = Math.floor(1000 + Math.random() * 2000);
        step.message = `${step.name} completed successfully`;
        onProgress?.(step);

        console.log(`Completed step: ${step.name}`);
      }

      // Start compile step but don't complete it automatically
      const compileStep = steps[steps.length - 1];
      compileStep.status = 'running';
      compileStep.message = 'Ready for compilation. Please use the Compile button in the Compiler Logs tab.';
      onProgress?.(compileStep);

      // Return partial result - compile step will be completed externally
      const result = {
        success: false, // Not fully complete yet
        steps,
        message: 'Configuration processed up to compilation step. Manual compilation required.'
      };

      console.log('Mock processing paused at compile step:', result);
      return result;
    } catch (error) {
      console.error('Mock processing failed:', error);
      return {
        success: false,
        steps,
        errors: [error instanceof Error ? error.message : 'Mock processing failed']
      };
    }
  }
}

export const configurationService = new ConfigurationService();
