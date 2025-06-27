import { NextResponse } from 'next/server';
import { createAgentCompilerService } from '@/lib/compiler/agent-compiler-interface';
import type { AgentPluginConfig } from '@/lib/compiler/agent-compiler-interface';
import { sendCompilationUpdate } from '@/lib/websocket-utils';
import { createGitHubActionsCompiler } from '@/lib/github-actions-compiler';

export async function POST(request: Request) {
  console.log('🚀 Compile function started');

  try {
    const payload = await request.json();
    console.log('📦 Request body parsed successfully');

    const { agentConfig, advancedSettings, selectedPlatform, buildTarget } = payload;
    console.log('🔧 Extracted config:', { hasAgentConfig: !!agentConfig, buildTarget, selectedPlatform });

    // Check GitHub Actions configuration
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;
    console.log('🔑 GitHub config:', {
      hasToken: !!githubToken,
      owner: githubOwner || 'guiperry',
      repo: githubRepo || 'next-agentify'
    });

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
        console.error('GitHub Actions compiler not available. Missing environment variables.');
        console.error('Required: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
        throw new Error(`Compilation failed: ${localError instanceof Error ? localError.message : String(localError)}. GitHub Actions fallback is not configured. Please ensure GITHUB_TOKEN and other required environment variables are set in Netlify.`);
      }

      try {
        await sendCompilationUpdate('compilation', 70, 'Triggering GitHub Actions compilation...');
        const jobId = await githubCompiler.triggerCompilation(pluginConfig);

        await sendCompilationUpdate('compilation', 80, 'GitHub Actions compilation started. Check GitHub Actions tab for progress...');
        const result = await githubCompiler.waitForCompletion(jobId, 60000); // 1 minute timeout

        if (result.status === 'completed') {
          // For GitHub Actions, we'll return a different response format
          pluginPath = result.downloadUrl || '';
          compilationLogs = ['GitHub Actions compilation completed successfully'];
          await sendCompilationUpdate('compilation', 100, 'GitHub Actions compilation completed');
        } else if (result.status === 'failed') {
          throw new Error(result.error || 'GitHub Actions compilation failed');
        } else {
          // Still in progress - return a partial success with instructions
          await sendCompilationUpdate('compilation', 90, 'GitHub Actions compilation in progress. Check GitHub Actions tab for status.');
          return NextResponse.json({
            success: true,
            message: 'Compilation started via GitHub Actions. Check the GitHub Actions tab in your repository for progress and download the artifact when complete.',
            compilationMethod: 'github-actions',
            status: 'in_progress',
            jobId: jobId,
            githubActionsUrl: `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions`
          });
        }
      } catch (githubError) {
        throw new Error(`All compilation methods failed. Local: ${localError instanceof Error ? localError.message : String(localError)}. GitHub Actions: ${githubError instanceof Error ? githubError.message : String(githubError)}`);
      }
    }

    // Extract filename from the plugin path for download URL
    const isGitHubActionsUsed = pluginPath.startsWith('http');
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