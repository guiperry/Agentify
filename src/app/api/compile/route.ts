import { NextResponse } from 'next/server';
import { createAgentCompilerService } from '@/lib/compiler/agent-compiler-interface';
import type { AgentPluginConfig } from '@/lib/compiler/agent-compiler-interface';
import { sendCompilationUpdate } from '@/lib/websocket-utils';
import { createGitHubActionsCompiler } from '@/lib/github-actions-compiler';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { agentConfig, advancedSettings, selectedPlatform, buildTarget } = payload;

    if (!agentConfig) {
      return NextResponse.json({
        success: false,
        message: 'Missing agent configuration'
      }, { status: 400 });
    }

    // Send initial compilation update
    await sendCompilationUpdate('initialization', 10, 'Initializing compiler service...');

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

    // Send configuration processing update
    await sendCompilationUpdate('configuration', 30, 'Processing agent configuration...');

    // Convert UI config to compiler config
    let pluginConfig: AgentPluginConfig;
    try {
      pluginConfig = compilerService.convertUIConfigToPluginConfig(uiConfigForConversion);
    } catch (conversionError) {
      await sendCompilationUpdate('configuration', 30, `Configuration conversion failed: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`, 'error');
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

    // Set build target (default to WASM)
    pluginConfig.buildTarget = buildTarget || 'wasm';

    // Handle platform-specific settings
    if (selectedPlatform === 'windows') {
      process.env.GOOS = 'windows';
    } else if (selectedPlatform === 'mac') {
      process.env.GOOS = 'darwin';
    } else {
      process.env.GOOS = 'linux';
    }

    // Try local compilation first
    let pluginPath: string;
    let compilationLogs: string[];
    let isGitHubActionsUsed = false;

    try {
      // Attempt local compilation
      await sendCompilationUpdate('compilation', 50, 'Starting local compilation...');
      pluginPath = await compilerService.compileAgent(pluginConfig);
      compilationLogs = compilerService.getCompilationLogs();
      await sendCompilationUpdate('compilation', 90, 'Local compilation completed successfully');
    } catch (localError) {
      console.log('Local compilation failed, trying GitHub Actions fallback:', localError);
      await sendCompilationUpdate('compilation', 60, 'Local compilation failed, using GitHub Actions fallback...');

      // Try GitHub Actions fallback
      const githubCompiler = createGitHubActionsCompiler();
      if (!githubCompiler) {
        throw new Error('Both local compilation and GitHub Actions fallback are unavailable');
      }

      try {
        await sendCompilationUpdate('compilation', 70, 'Triggering GitHub Actions compilation...');
        const jobId = await githubCompiler.triggerCompilation(pluginConfig);

        await sendCompilationUpdate('compilation', 80, 'Waiting for GitHub Actions compilation to complete...');
        const result = await githubCompiler.waitForCompletion(jobId, 300000); // 5 minutes timeout

        if (result.status !== 'completed') {
          throw new Error(result.error || 'GitHub Actions compilation failed');
        }

        // For GitHub Actions, we'll return a different response format
        isGitHubActionsUsed = true;
        pluginPath = result.downloadUrl || '';
        compilationLogs = ['GitHub Actions compilation completed successfully'];
        await sendCompilationUpdate('compilation', 100, 'GitHub Actions compilation completed');
      } catch (githubError) {
        throw new Error(`All compilation methods failed. Local: ${localError instanceof Error ? localError.message : String(localError)}. GitHub Actions: ${githubError instanceof Error ? githubError.message : String(githubError)}`);
      }
    }

    // Extract filename from the plugin path for download URL
    const filename = isGitHubActionsUsed ? `github-actions-${Date.now()}.zip` : (pluginPath.split('/').pop() || '');
    const downloadUrl = isGitHubActionsUsed ? pluginPath : `/api/download/plugin/${filename}`;

    // Return success response
    return NextResponse.json({
      success: true,
      pluginPath,
      downloadUrl,
      filename,
      logs: compilationLogs,
      message: isGitHubActionsUsed ? 'Agent compiled successfully via GitHub Actions' : 'Agent compiled successfully',
      compilationMethod: isGitHubActionsUsed ? 'github-actions' : 'local'
    });
  } catch (error) {
    console.error('Compilation error:', error);
    await sendCompilationUpdate('compilation', 0, `Compilation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return NextResponse.json({
      success: false,
      message: `Compilation failed: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}