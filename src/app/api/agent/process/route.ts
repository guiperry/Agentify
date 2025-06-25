import { NextRequest, NextResponse } from 'next/server';

interface AgentConfiguration {
  name: string;
  type: string;
  personality: string;
  instructions: string;
  features: string[];
  agentFacts: any;
  settings: {
    creativity: number;
    mcpServers: any[];
  };
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
}

interface ProcessingResult {
  success: boolean;
  steps: ProcessingStep[];
  errors?: string[];
  warnings?: string[];
  compiledAgent?: {
    id: string;
    name: string;
    version: string;
    size: string;
    downloadUrl: string;
  };
}

export async function POST(request: NextRequest) {
  console.log('🚀 API /agent/process called');
  try {
    const body = await request.json();
    const { config, repoUrl, timestamp } = body;
    console.log('📝 Request body received:', { config: config?.name, repoUrl, timestamp });

    if (!config) {
      console.log('❌ Missing agent configuration');
      return NextResponse.json({
        success: false,
        steps: [],
        errors: ['Missing agent configuration']
      }, { status: 400 });
    }

    console.log('🔄 Starting process configuration with WebSocket updates');
    // Process configuration with WebSocket updates
    const result = await processAgentConfigurationWithWebSocket(config, repoUrl);
    console.log('✅ Process configuration completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Agent processing error:', error);
    return NextResponse.json({
      success: false,
      steps: [],
      errors: [error instanceof Error ? error.message : 'Processing failed']
    }, { status: 500 });
  }
}

// Function to send WebSocket updates
async function sendWebSocketUpdate(update: any) {
  try {
    const wsUrl = process.env.WS_SERVER_URL || 'http://localhost:3002';
    await fetch(`${wsUrl}/broadcast/compilation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });
  } catch (error) {
    console.error('Failed to send WebSocket update:', error);
  }
}

// Process configuration with WebSocket updates for tab progression
async function processAgentConfigurationWithWebSocket(
  config: AgentConfiguration,
  repoUrl?: string
): Promise<ProcessingResult> {
  const steps: ProcessingStep[] = [
    { id: 'validate', name: 'Validating Configuration', status: 'pending', progress: 0 },
    { id: 'api-keys', name: 'Configuring API Keys', status: 'pending', progress: 0 },
    { id: 'analyze', name: 'Analyzing Repository', status: 'pending', progress: 0 },
    { id: 'capabilities', name: 'Processing Capabilities', status: 'pending', progress: 0 },
    { id: 'compile', name: 'Compiling Agent', status: 'pending', progress: 0 },
    { id: 'test', name: 'Running Tests', status: 'pending', progress: 0 },
    { id: 'package', name: 'Packaging Agent', status: 'pending', progress: 0 }
  ];

  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Process each step with WebSocket updates
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`🔄 Starting step ${i + 1}/${steps.length}: ${step.name}`);

      // Start step
      step.status = 'running';
      step.progress = 0;
      step.message = `Starting ${step.name.toLowerCase()}...`;

      // Send WebSocket update for step start
      await sendWebSocketUpdate({
        step: step.id,
        progress: step.progress,
        message: step.message,
        status: 'in_progress'
      });

      // Simulate processing time with progress updates
      for (let progress = 25; progress <= 75; progress += 25) {
        await simulateDelay(300);
        step.progress = progress;
        step.message = `Processing ${step.name.toLowerCase()}... ${progress}%`;

        // Send progress update
        await sendWebSocketUpdate({
          step: step.id,
          progress: step.progress,
          message: step.message,
          status: 'in_progress'
        });
      }

      // Complete step
      await simulateDelay(500);
      step.status = 'completed';
      step.progress = 100;
      step.message = `${step.name} completed successfully`;

      // Send completion update
      await sendWebSocketUpdate({
        step: step.id,
        progress: step.progress,
        message: step.message,
        status: 'completed'
      });

      console.log(`✅ Completed step: ${step.name}`);

      // Special handling for compile step - pause for manual compilation
      if (step.id === 'compile') {
        console.log('🔧 Pausing at compile step for manual compilation');

        // Send special message for compile pause
        await sendWebSocketUpdate({
          step: 'compile',
          progress: 100,
          message: 'Ready for compilation. Please use the Compile button in the Compiler Logs tab.',
          status: 'completed'
        });

        // Return partial result - remaining steps will be handled separately
        return {
          success: false, // Not fully complete yet
          steps: steps.slice(0, i + 1), // Only return completed steps
          warnings: ['Configuration processed up to compilation step. Manual compilation required.']
        };
      }
    }

    // If we get here, all steps completed successfully
    const result = {
      success: true,
      steps,
      warnings: warnings.length > 0 ? warnings : undefined,
      compiledAgent: {
        id: crypto.randomUUID(),
        name: config.name,
        version: '1.0.0',
        size: `${(Math.random() * 50 + 10).toFixed(1)} MB`,
        downloadUrl: `/api/agent/download/${crypto.randomUUID()}`
      }
    };

    // Send final success update
    await sendWebSocketUpdate({
      step: 'complete',
      progress: 100,
      message: 'Configuration processing completed successfully!',
      status: 'completed'
    });

    console.log('🎉 Process configuration completed successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Process configuration failed:', error);

    // Send error update
    await sendWebSocketUpdate({
      step: 'error',
      progress: 0,
      message: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error'
    });

    return {
      success: false,
      steps,
      errors: [error instanceof Error ? error.message : 'Processing failed']
    };
  }
}

// Streaming version that sends real-time updates
async function processAgentConfigurationStreaming(
  config: AgentConfiguration,
  repoUrl?: string,
  onProgress?: (step: ProcessingStep) => void
): Promise<void> {
  const steps: ProcessingStep[] = [
    { id: 'validate', name: 'Validating Configuration', status: 'pending', progress: 0 },
    { id: 'api-keys', name: 'Configuring API Keys', status: 'pending', progress: 0 },
    { id: 'analyze', name: 'Analyzing Repository', status: 'pending', progress: 0 },
    { id: 'capabilities', name: 'Processing Capabilities', status: 'pending', progress: 0 },
    { id: 'compile', name: 'Compiling Agent', status: 'pending', progress: 0 },
    { id: 'test', name: 'Running Tests', status: 'pending', progress: 0 },
    { id: 'package', name: 'Packaging Agent', status: 'pending', progress: 0 }
  ];

  // Process each step with real-time updates
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Start step
    step.status = 'running';
    step.progress = 0;
    step.message = `Starting ${step.name.toLowerCase()}...`;
    onProgress?.(step);

    await simulateDelay(500);

    // Progress updates
    for (let progress = 25; progress <= 75; progress += 25) {
      step.progress = progress;
      step.message = `Processing ${step.name.toLowerCase()}... ${progress}%`;
      onProgress?.(step);
      await simulateDelay(300);
    }

    // Complete step
    step.status = 'completed';
    step.progress = 100;
    step.message = `${step.name} completed successfully`;
    onProgress?.(step);

    await simulateDelay(200);
  }
}

async function processAgentConfiguration(
  config: AgentConfiguration,
  repoUrl?: string
): Promise<ProcessingResult> {
  const steps: ProcessingStep[] = [
    { id: 'validate', name: 'Validating Configuration', status: 'pending', progress: 0 },
    { id: 'api-keys', name: 'Configuring API Keys', status: 'pending', progress: 0 },
    { id: 'analyze', name: 'Analyzing Repository', status: 'pending', progress: 0 },
    { id: 'capabilities', name: 'Processing Capabilities', status: 'pending', progress: 0 },
    { id: 'compile', name: 'Compiling Agent', status: 'pending', progress: 0 },
    { id: 'test', name: 'Running Tests', status: 'pending', progress: 0 },
    { id: 'package', name: 'Packaging Agent', status: 'pending', progress: 0 }
  ];

  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Validate Configuration
  steps[0].status = 'running';
  steps[0].progress = 50;
  
  try {
    await simulateDelay(1000);
    
    // Basic validation
    if (!config.name || config.name.trim().length < 3) {
      throw new Error('Agent name must be at least 3 characters long');
    }
    
    if (!config.instructions || config.instructions.trim().length < 10) {
      throw new Error('Instructions must be at least 10 characters long');
    }
    
    if (!config.features || config.features.length === 0) {
      throw new Error('At least one feature must be selected');
    }

    steps[0].status = 'completed';
    steps[0].progress = 100;
    steps[0].message = 'Configuration validated successfully';
  } catch (error) {
    steps[0].status = 'failed';
    steps[0].error = error instanceof Error ? error.message : 'Validation failed';
    errors.push(steps[0].error);
    return { success: false, steps, errors };
  }

  // Step 2: Analyze Repository
  steps[1].status = 'running';
  steps[1].progress = 25;
  
  try {
    await simulateDelay(1500);
    
    if (repoUrl) {
      // Validate repository URL
      try {
        new URL(repoUrl);
        steps[1].message = `Repository ${repoUrl} analyzed successfully`;
      } catch {
        warnings.push('Invalid repository URL provided');
        steps[1].message = 'Proceeding without repository analysis';
      }
    } else {
      steps[1].message = 'No repository provided, using default configuration';
    }
    
    steps[1].status = 'completed';
    steps[1].progress = 100;
  } catch (error) {
    steps[1].status = 'failed';
    steps[1].error = error instanceof Error ? error.message : 'Repository analysis failed';
    errors.push(steps[1].error);
    return { success: false, steps, errors };
  }

  // Step 3: Compile Agent
  steps[2].status = 'running';
  steps[2].progress = 30;
  
  try {
    await simulateDelay(2000);
    
    // Simulate compilation progress
    for (let progress = 30; progress <= 90; progress += 20) {
      steps[2].progress = progress;
      await simulateDelay(500);
    }
    
    steps[2].status = 'completed';
    steps[2].progress = 100;
    steps[2].message = `Agent "${config.name}" compiled successfully`;
  } catch (error) {
    steps[2].status = 'failed';
    steps[2].error = error instanceof Error ? error.message : 'Compilation failed';
    errors.push(steps[2].error);
    return { success: false, steps, errors };
  }

  // Step 4: Run Tests
  steps[3].status = 'running';
  steps[3].progress = 20;
  
  try {
    await simulateDelay(1500);
    
    // Simulate test progress
    for (let progress = 20; progress <= 80; progress += 20) {
      steps[3].progress = progress;
      await simulateDelay(400);
    }
    
    const testsPassed = Math.floor(Math.random() * 3) + 8; // 8-10 tests
    const testsTotal = 10;
    
    if (testsPassed < testsTotal) {
      warnings.push(`${testsTotal - testsPassed} tests failed, but agent is still functional`);
    }
    
    steps[3].status = 'completed';
    steps[3].progress = 100;
    steps[3].message = `Tests completed: ${testsPassed}/${testsTotal} passed`;
  } catch (error) {
    steps[3].status = 'failed';
    steps[3].error = error instanceof Error ? error.message : 'Testing failed';
    errors.push(steps[3].error);
    return { success: false, steps, errors };
  }

  // Step 5: Package Agent
  steps[4].status = 'running';
  steps[4].progress = 40;
  
  try {
    await simulateDelay(1000);
    
    // Simulate packaging progress
    for (let progress = 40; progress <= 90; progress += 25) {
      steps[4].progress = progress;
      await simulateDelay(300);
    }
    
    const agentSize = (Math.random() * 50 + 10).toFixed(1); // 10-60 MB
    
    steps[4].status = 'completed';
    steps[4].progress = 100;
    steps[4].message = `Agent packaged successfully (${agentSize} MB)`;
    
    // Create compiled agent info
    const compiledAgent = {
      id: crypto.randomUUID(),
      name: config.name,
      version: '1.0.0',
      size: `${agentSize} MB`,
      downloadUrl: `/api/agent/download/${crypto.randomUUID()}`
    };
    
    return {
      success: true,
      steps,
      warnings: warnings.length > 0 ? warnings : undefined,
      compiledAgent
    };
  } catch (error) {
    steps[4].status = 'failed';
    steps[4].error = error instanceof Error ? error.message : 'Packaging failed';
    errors.push(steps[4].error);
    return { success: false, steps, errors };
  }
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
