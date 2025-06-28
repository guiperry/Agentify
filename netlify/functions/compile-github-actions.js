const { createClient } = require('@supabase/supabase-js');
const { createGitHubActionsCompiler } = require('./lib/github-actions-compiler.js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function getUser(event) {
  const token = event.queryStringParameters?.token;
  if (!token) return { user: null };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return { user: null };
  
  return { user };
}

async function getUserAgentConfig(userId) {
  const { data, error } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

/**
 * Send SSE message to client
 */
function sendSSEMessage(type, data, timestamp = new Date().toISOString()) {
  const message = JSON.stringify({
    type,
    data,
    timestamp
  });
  return `data: ${message}\n\n`;
}

/**
 * GitHub Actions compilation with SSE streaming
 */
exports.handler = async (event, context) => {
  const { user } = await getUser(event);
  if (!user) return { statusCode: 401, body: 'Unauthorized' };

  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Handle POST request to start GitHub Actions compilation
  if (event.httpMethod === 'POST') {
    try {
      // Parse request body
      const payload = JSON.parse(event.body || '{}');
      const { agentConfig, advancedSettings, selectedPlatform, buildTarget } = payload;

      if (!agentConfig) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Missing agent configuration'
          })
        };
      }

      // Get user's agent config from Supabase
      const config = await getUserAgentConfig(user.id);
      if (!config) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'No agent configuration found'
          })
        };
      }

      // Create GitHub Actions compiler
      const githubCompiler = createGitHubActionsCompiler();
      if (!githubCompiler) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'GitHub Actions compiler not available. Missing environment variables.'
          })
        };
      }

      // Prepare plugin configuration
      const pluginConfig = {
        ...agentConfig,
        buildTarget: buildTarget || 'wasm',
        platform: selectedPlatform || 'linux',
        advancedSettings: advancedSettings || {}
      };

      // Trigger GitHub Actions compilation
      const jobId = await githubCompiler.triggerCompilation(pluginConfig);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'GitHub Actions compilation started',
          compilationMethod: 'github-actions',
          status: 'in_progress',
          jobId,
          githubActionsUrl: `https://github.com/${process.env.GITHUB_OWNER || 'guiperry'}/${process.env.GITHUB_REPO || 'next-agentify'}/actions`
        })
      };

    } catch (error) {
      console.error('GitHub Actions compilation error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: `GitHub Actions compilation failed: ${error instanceof Error ? error.message : String(error)}`
        })
      };
    }
  }

  // Handle GET request for SSE streaming of compilation status
  if (event.httpMethod === 'GET') {
    const jobId = event.queryStringParameters?.jobId;
    
    if (!jobId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Missing jobId parameter'
        })
      };
    }

    try {
      // Create GitHub Actions compiler
      const githubCompiler = createGitHubActionsCompiler();
      if (!githubCompiler) {
        const errorMessage = sendSSEMessage('error', {
          message: 'GitHub Actions compiler not available'
        });
        return {
          statusCode: 200,
          headers,
          body: errorMessage
        };
      }

      // Start SSE stream with initial connection message
      let responseBody = sendSSEMessage('connection', {
        message: 'GitHub Actions compilation monitoring started',
        jobId
      });

      // Poll GitHub Actions status and stream updates
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      let attempts = 0;

      const pollStatus = async () => {
        while (attempts < maxAttempts) {
          try {
            const status = await githubCompiler.getCompilationStatus(jobId);
            
            // Send status update via SSE
            responseBody += sendSSEMessage('compilation_update', {
              step: 'github_actions',
              progress: Math.min(20 + (attempts * 1.2), 95),
              message: `GitHub Actions status: ${status.status}`,
              status: status.status === 'completed' ? 'completed' : 
                     status.status === 'failed' ? 'error' : 'in_progress',
              jobId
            });

            if (status.status === 'completed') {
              // Compilation successful
              responseBody += sendSSEMessage('compilation_complete', {
                success: true,
                message: 'GitHub Actions compilation completed successfully',
                downloadUrl: status.downloadUrl,
                filename: `agent-plugin-${jobId}.zip`,
                jobId
              });
              break;
            } else if (status.status === 'failed') {
              // Compilation failed
              responseBody += sendSSEMessage('compilation_error', {
                success: false,
                message: status.error || 'GitHub Actions compilation failed',
                jobId
              });
              break;
            }

            // Wait 5 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;

          } catch (error) {
            console.error('Polling error:', error);
            responseBody += sendSSEMessage('compilation_update', {
              step: 'github_actions',
              progress: Math.min(20 + (attempts * 1.2), 95),
              message: `Polling error: ${error instanceof Error ? error.message : String(error)}`,
              status: 'in_progress',
              jobId
            });

            // Continue polling unless max attempts reached
            if (attempts >= maxAttempts - 1) {
              responseBody += sendSSEMessage('compilation_error', {
                success: false,
                message: 'GitHub Actions compilation monitoring timed out',
                jobId
              });
              break;
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
          }
        }

        // If we exit the loop due to timeout
        if (attempts >= maxAttempts) {
          responseBody += sendSSEMessage('compilation_error', {
            success: false,
            message: 'GitHub Actions compilation monitoring timed out. Check GitHub Actions tab for status.',
            jobId
          });
        }
      };

      // Start polling (this will run asynchronously)
      await pollStatus();

      return {
        statusCode: 200,
        headers,
        body: responseBody
      };

    } catch (error) {
      const errorMessage = sendSSEMessage('error', {
        message: error instanceof Error ? error.message : String(error),
        jobId
      });
      
      return {
        statusCode: 200,
        headers,
        body: errorMessage
      };
    }
  }

  // Method not allowed
  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: false,
      message: 'Method not allowed'
    })
  };
};
