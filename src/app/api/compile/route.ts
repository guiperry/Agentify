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
      // CRITICAL FIX: Explicitly add agent_name to ensure it's available for GitHub Actions compilation
      agent_name: agentConfig.agent_name || agentConfig.name || `agent-${Date.now()}`,
      personality: agentConfig.personality,
      instructions: agentConfig.instructions || `You are ${agentConfig.name}, a helpful AI assistant.`,
      features: agentConfig.features,
      settings: {
        mcpServers: agentConfig.settings?.mcpServers || [],
        creativity: agentConfig.settings?.creativity || 0.7
      }
    };
    
    // Log the UI config for debugging
    console.log('UI config for conversion:', {
      name: uiConfigForConversion.name,
      agent_name: uiConfigForConversion.agent_name,
      hasAgentName: !!uiConfigForConversion.agent_name
    });

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
      const githubCompiler = await createGitHubActionsCompiler();
      if (!githubCompiler) {
        console.error('GitHub Actions compiler not available. Missing environment variables.');
        console.error('Required: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
        throw new Error(`Compilation failed: ${localError instanceof Error ? localError.message : String(localError)}. GitHub Actions fallback is not configured. Please ensure GITHUB_TOKEN and other required environment variables are set in Netlify.`);
      }

      try {
        await sendCompilationUpdate('compilation', 70, 'Triggering GitHub Actions compilation...');
        
        // Ensure agent_name is set in the plugin configuration
        if (!pluginConfig.agent_name && (pluginConfig as any).name) {
          console.log('Setting agent_name from name property:', (pluginConfig as any).name);
          pluginConfig.agent_name = (pluginConfig as any).name;
        }
        
        // Log the configuration for debugging
        console.log('Plugin configuration before GitHub Actions:', {
          name: (pluginConfig as any).name,
          agent_name: pluginConfig.agent_name,
          hasAgentName: !!pluginConfig.agent_name
        });
        
        const jobId = await githubCompiler.triggerCompilation(pluginConfig);

        await sendCompilationUpdate('compilation', 80, 'GitHub Actions compilation started. Check GitHub Actions tab for progress...');

        // Don't wait for completion - return immediately with job ID for polling
        console.log('🚀 GitHub Actions compilation started with job ID:', jobId);
        return NextResponse.json({
          success: true,
          message: 'Compilation started via GitHub Actions. Check the GitHub Actions tab in your repository for progress and download the artifact when complete.',
          compilationMethod: 'github-actions',
          status: 'in_progress',
          jobId: jobId,
          githubActionsUrl: `https://github.com/${process.env.GITHUB_OWNER || 'guiperry'}/${process.env.GITHUB_REPO || 'next-agentify'}/actions`
        });
      } catch (githubError) {
        console.error('GitHub Actions compilation failed:', githubError);
        throw new Error(`GitHub Actions compilation failed: ${githubError instanceof Error ? githubError.message : String(githubError)}`);
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