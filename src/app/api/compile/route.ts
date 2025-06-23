import { NextResponse } from 'next/server';
import { createAgentCompilerService } from '@/lib/compiler/agent-compiler-interface';
import type { AgentPluginConfig } from '@/lib/compiler/agent-compiler-interface';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { agentConfig, advancedSettings, selectedPlatform } = payload;

    if (!agentConfig) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing agent configuration' 
      }, { status: 400 });
    }

    // Initialize the compiler service
    const compilerService = await createAgentCompilerService();

    // Create a UI config object that matches the expected format for conversion
    const uiConfigForConversion = {
      name: agentConfig.name,
      personality: agentConfig.personality,
      instructions: agentConfig.instructions || `You are ${agentConfig.name}, a helpful AI assistant.`,
      features: agentConfig.features,
      settings: {
        mcpServers: agentConfig.settings?.mcpServers || [],
        creativity: agentConfig.settings?.creativity || 0.7
      }
    };

    // Convert UI config to compiler config
    let pluginConfig: AgentPluginConfig;
    try {
      pluginConfig = compilerService.convertUIConfigToPluginConfig(uiConfigForConversion);
    } catch (conversionError) {
      return NextResponse.json({
        success: false,
        message: `Configuration conversion failed: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`
      }, { status: 400 });
    }

    // Apply advanced settings from the UI
    if (advancedSettings) {
      pluginConfig.trustedExecutionEnvironment = {
        isolationLevel: advancedSettings.isolationLevel as 'process' | 'container' | 'vm',
        resourceLimits: {
          memory: advancedSettings.memoryLimit,
          cpu: advancedSettings.cpuCores,
          timeLimit: advancedSettings.timeLimit
        },
        networkAccess: advancedSettings.networkAccess,
        fileSystemAccess: advancedSettings.fileSystemAccess
      };
      
      pluginConfig.useChromemGo = advancedSettings.useChromemGo;
      pluginConfig.subAgentCapabilities = advancedSettings.subAgentCapabilities;
    }

    // Handle platform-specific settings
    if (selectedPlatform === 'windows') {
      process.env.GOOS = 'windows';
    } else if (selectedPlatform === 'mac') {
      process.env.GOOS = 'darwin';
    } else {
      process.env.GOOS = 'linux';
    }

    // Compile the agent
    const pluginPath = await compilerService.compileAgent(pluginConfig);

    // Return success response
    return NextResponse.json({
      success: true,
      pluginPath,
      message: 'Agent compiled successfully'
    });
  } catch (error) {
    console.error('Compilation error:', error);
    return NextResponse.json({
      success: false,
      message: `Compilation failed: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}