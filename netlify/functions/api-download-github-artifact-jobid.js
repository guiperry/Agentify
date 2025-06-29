// Auto-generated Netlify function from Next.js API route
// Original route: /api/download/github-artifact/[jobId]
// Generated: 2025-06-29T11:16:38.463Z

// NextResponse/NextRequest converted to native Netlify response format
const { createGitHubActionsCompiler } = require('./lib/github-actions-compiler.js');

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
};

// Extract route parameters
function extractParams(event, routePath) {
  const pathSegments = event.path.replace('/api/', '').split('/');
  const routeSegments = routePath.split('/');
  const params = {};
  
  routeSegments.forEach((segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const paramName = segment.slice(1, -1);
      params[paramName] = pathSegments[index];
    }
  });
  
  return params;
}

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
  
  // Extract route parameters from path
  const pathSegments = event.path.replace('/api/', '').split('/');
  const params = event.pathParameters || {};

  // For dynamic routes, extract parameters from path
  if (event.path.includes('/')) {
    // This will be handled by the main handler's extractParams function
  }

  try {
    const { jobId } = params;

    console.log(`📦 Downloading GitHub Actions artifact for job: ${jobId}`);

    // Validate jobId
    if (!jobId || jobId.includes('..') || jobId.includes('/')) {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Invalid job ID'})
    };
    }

    // Get GitHub Actions compiler
    const githubCompiler = await createGitHubActionsCompiler();
    if (!githubCompiler) {
      return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'GitHub Actions compiler not available'})
    };
    }

    // Get compilation status to get download URL
    const status = await githubCompiler.getCompilationStatus(jobId);
    
    console.log(`📊 Compilation status for job ${jobId}:`, {
      status: status.status,
      hasDownloadUrl: !!status.downloadUrl,
      hasRawDownloadUrl: !!status.rawDownloadUrl
    });

    if (status.status !== 'completed' || !status.rawDownloadUrl) {
      console.error(`❌ Cannot download artifact: status=${status.status}, rawDownloadUrl=${status.rawDownloadUrl ? 'present' : 'missing'}`);
      return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Compilation not completed or download URL not available'})
    };
    }

    console.log(`📥 Downloading artifact from: ${status.rawDownloadUrl}`);

    // Download the artifact zip file directly from GitHub
    console.log(`🔑 Using GitHub token: ${process.env.GITHUB_TOKEN ? 'present (length: ' + process.env.GITHUB_TOKEN.length + ')' : 'missing'}`);
    
    let response;
    try {
      response = await fetch(status.rawDownloadUrl, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'next-agentify'
        }
      });

      console.log(`📡 GitHub API response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download artifact: ${response.status} ${response.statusText}`);
      }
      
      // Check if we have the expected content type
      const contentType = response.headers.get('content-type');
      console.log(`📦 Response content type: ${contentType}`);
      
      if (!contentType || (!contentType.includes('application/zip') && !contentType.includes('application/octet-stream'))) {
        console.warn(`⚠️ Unexpected content type: ${contentType}`);
      }
    } catch (fetchError) {
      console.error('🔥 Fetch error:', fetchError);
      throw new Error(`Failed to download artifact: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    // Get the zip file as a buffer
    const zipBuffer = Buffer.from(await response.arrayBuffer());

    console.log(`📦 Serving zip file (${zipBuffer.length} bytes) for job: ${jobId}`);

    // Return the entire zip file for download
    const downloadResponse = new NextResponse(zipBuffer);
    downloadResponse.headers.set('Content-Type', 'application/zip');
    
    // Get the agent name from the status if available
    const agentName = status.agentName || 'agent';
    const sanitizedAgentName = agentName !== 'agent' ? 
      agentName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() : 
      `agent-${jobId.split('-')[1]}`;
    
    // Set the filename to include the agent name and jobId
    downloadResponse.headers.set('Content-Disposition', `attachment; filename="${sanitizedAgentName}-plugin-${jobId}.zip"`);
    
    downloadResponse.headers.set('Content-Length', zipBuffer.length.toString());
    downloadResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return downloadResponse;

  } catch (error) {
    console.error('GitHub artifact download error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: `Failed to download artifact: ${error instanceof Error ? error.message : String(error)}`})
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
    event.params = extractParams(event, 'download/github-artifact/[jobId]');
    
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
