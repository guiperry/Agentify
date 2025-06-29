// Auto-generated Netlify function from Next.js API route
// Original route: /api/compile/status
// Generated: 2025-06-29T08:55:09.558Z

// NextResponse/NextRequest converted to native Netlify response format
const { createGitHubActionsCompiler } = require('./lib/github-actions-compiler.js');

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
};

async function GET(event, context) {
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
  

  try {
    const { searchParams } = new URL(`https://${event.headers.host}${event.path}`);
    const jobId = searchParams.get('jobId');

    console.log(`🔍 Status check requested for job ID: ${jobId}`);

    if (!jobId) {
      console.log('❌ Missing jobId parameter');
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
        message: 'Missing jobId parameter'})
    };
    }

    // Check environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER || 'guiperry';
    const githubRepo = process.env.GITHUB_REPO || 'next-agentify';

    console.log(`🔧 GitHub config: owner=${githubOwner}, repo=${githubRepo}, token=${githubToken ? 'configured' : 'missing'}`);

    const githubCompiler = createGitHubActionsCompiler();
    if (!githubCompiler) {
      console.log('❌ GitHub Actions compiler not available - missing token');
      return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
        message: 'GitHub Actions compiler not available - GitHub token not configured'})
    };
    }

    console.log(`📡 Checking compilation status for job: ${jobId}`);
    const status = await githubCompiler.getCompilationStatus(jobId);

    console.log(`📊 Status result:`, status);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: true,
      status: status.status,
      downloadUrl: status.downloadUrl,
      error: status.error,
      logs: status.logs})
    };
  } catch (error) {
    console.error('Status check error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
      message: `Status check failed: ${error instanceof Error ? error.message : String(error)}`})
    };
  }
}

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
  

  try {
    const { jobId } = requestBody;

    if (!jobId) {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
        message: 'Missing jobId'})
    };
    }

    const githubCompiler = createGitHubActionsCompiler();
    if (!githubCompiler) {
      return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
        message: 'GitHub Actions compiler not available'})
    };
    }

    // Wait for completion with a reasonable timeout
    const result = await githubCompiler.waitForCompletion(jobId, 300000); // 5 minutes

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: result.status === 'completed',
      status: result.status,
      downloadUrl: result.downloadUrl,
      error: result.error,
      logs: result.logs,
      message: result.status === 'completed' ? 'Compilation completed successfully' : 'Compilation failed or timed out'})
    };
  } catch (error) {
    console.error('Compilation wait error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
      message: `Compilation wait failed: ${error instanceof Error ? error.message : String(error)}`})
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
      
      case 'GET':
        if (typeof GET === 'function') {
          const result = await GET(event);
          return {
            ...result,
            headers: { ...corsHeaders, ...(result.headers || {}) }
          };
        }
        break;
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
exports.get = GET;
exports.post = POST;
