// Auto-generated Netlify function from Next.js API route
// Original route: /api/compile
// Generated: 2025-06-29T10:37:51.133Z

// NextResponse/NextRequest converted to native Netlify response format
const { createAgentCompilerService } = require('./lib/agent-compiler-interface.js');
const { sendCompilationUpdate } = require('./lib/websocket-utils.js');
const { createGitHubActionsCompiler } = require('./lib/github-actions-compiler.js');

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
};

async function POST(event, context) {
  // Extract route parameters if this is a dynamic route
  if (event.pathParameters) {
    event.params = event.pathParameters;
  }

  // Parse request body if present
  let requestBody = {};
  if (event.body) {
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      requestBody = event.body;
    }
  }
  

  console.log('🚀 Compile function started');

  try {
    const payload = requestBody;
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
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
        message: 'Missing agent configuration'})
    };
    }

    // Send initial compilation update
    await sendCompilationUpdate('initialization', 10, 'Initializing compiler service...');

    // Initialize the compiler service
    const compilerService = await createAgentCompilerService();

    // Create a UI config object that matches the expected format for conversion
    const uiConfigForConversion = {
      name: agentConfig.name,
      // Explicitly add agent_name to ensure it's available for GitHub Actions compilation
      agent_name: agentConfig.agent_name || agentConfig.name,
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
    let pluginConfig;
    try {
      pluginConfig = compilerService.convertUIConfigToPluginConfig(uiConfigForConversion);
    } catch (conversionError) {
      await sendCompilationUpdate('configuration', 30, `Configuration conversion failed: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`, 'error');
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
        message: `Configuration conversion failed: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`})
    };
    }

    // Apply advanced settings from the UI
    if (advancedSettings) {
      pluginConfig.trustedExecutionEnvironment = {
        isolationLevel: advancedSettings.isolationLevel,
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
    let pluginPath;
    let compilationLogs;

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
        console.error('Required, GITHUB_OWNER, GITHUB_REPO');
        throw new Error(`Compilation failed: ${localError instanceof Error ? localError.message : String(localError)}. GitHub Actions fallback is not configured. Please ensure GITHUB_TOKEN and other required environment variables are set in Netlify.`);
      }

      try {
        await sendCompilationUpdate('compilation', 70, 'Triggering GitHub Actions compilation...');
        
        // Ensure agent_name is set in the plugin configuration
        if (!pluginConfig.agent_name && (pluginConfig).name) {
          console.log('Setting agent_name from name property:', (pluginConfig).name);
          pluginConfig.agent_name = (pluginConfig).name;
        }
        
        // Log the configuration for debugging
        console.log('Plugin configuration before GitHub Actions:', {
          name: (pluginConfig).name,
          agent_name: pluginConfig.agent_name,
          hasAgentName: !!pluginConfig.agent_name
        });
        
        const jobId = await githubCompiler.triggerCompilation(pluginConfig);

        await sendCompilationUpdate('compilation', 80, 'GitHub Actions compilation started. Check GitHub Actions tab for progress...');

        // Don't wait for completion - return immediately with job ID for polling
        console.log('🚀 GitHub Actions compilation started with job ID:', jobId);
        return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: true,
          message: 'Compilation started via GitHub Actions. Check the GitHub Actions tab in your repository for progress and download the artifact when complete.',
          compilationMethod: 'github-actions',
          status: 'in_progress',
          jobId,
          githubActionsUrl: `https://github.com/${process.env.GITHUB_OWNER || 'guiperry'}/${process.env.GITHUB_REPO || 'next-agentify'}/actions`})
    };
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
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: true,
      pluginPath,
      downloadUrl,
      filename,
      logs,
      message: isGitHubActionsUsed ? 'Agent compiled successfully via GitHub Actions' : 'Agent compiled successfully',
      compilationMethod: isGitHubActionsUsed ? 'github-actions' : 'local'})
    };
  } catch (error) {
    console.error('Compilation error:', error);
    await sendCompilationUpdate('compilation', 0, `Compilation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
      message: `Compilation failed: ${error instanceof Error ? error.message : String(error)}`})
    };
  }
}

// Main Netlify function handler
exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const method = event.httpMethod;
    
    // Add route parameters to event if dynamic route
    
    
    // Route to appropriate handler
    switch (method) {
      
      case 'POST':
        if (typeof POST === 'function') {
          const result = await POST(event);
          return {
            ...result,
            headers: { ...corsHeaders, ...(result.headers || {}) }
          };
        }
        break;
      
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Handler not found' })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Export individual handlers for testing
exports.post = POST;
