// Auto-generated Netlify function from Next.js API route
// Original route: /api/download/engine/[platform]
// Generated: 2025-06-27T19:32:14.144Z

// NextResponse/NextRequest converted to native Netlify response format
const { readFile, stat, readdir } = require('fs/promises');
const { join } = require('path');

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
    const { platform } = params;
    
    // Validate platform
    if (!platform || !PLATFORM_FILES[platform) {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Invalid platform. Supported platforms, mac, linux'})
    };
    }
    
    const platformConfig = PLATFORM_FILES[platform;
    const releasesDir = join(process.cwd(), 'public', 'releases');
    
    try {
      // Find the latest release file for the platform
      const files = await readdir(releasesDir);
      const platformFiles = files.filter(file => platformConfig.pattern.test(file));
      
      if (platformFiles.length === 0) {
        return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: `No Agentic Engine release found for ${platform}`})
    };
      }
      
      // Sort by filename to get the latest version (assuming semantic versioning in filename)
      const latestFile = platformFiles.sort().reverse()[0];
      const filePath = join(releasesDir, latestFile);
      
      // Check if file exists and get stats
      const fileStats = await stat(filePath);
      
      if (!fileStats.isFile()) {
        return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Release file not found'})
    };
      }
      
      // Read the file
      const fileBuffer = await readFile(filePath);
      
      // Create response with appropriate headers
      const response = new NextResponse(fileBuffer);
      response.headers.set('Content-Type', platformConfig.contentType);
      response.headers.set('Content-Disposition', `attachment; filename="${latestFile}"`);
      response.headers.set('Content-Length', fileStats.size.toString());
      response.headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      return response;
      
    } catch (fileError) {
      console.error('File access error:', fileError);
      return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: `No Agentic Engine release available for ${platform}`})
    };
    }
    
  } catch (error) {
    console.error('Engine download error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Internal server error'})
    };
  }
}

async function OPTIONS(event, context) {
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
    const releasesDir = join(process.cwd(), 'public', 'releases');
    
    try {
      const files = await readdir(releasesDir);
      const releases, string[]> = {
        windows: [],
        mac: [],
        linux: []
      };
      
      // Categorize files by platform
      for (const [platform, config] of Object.entries(PLATFORM_FILES)) {
        releases[platform] = files.filter(file => config.pattern.test(file));
      }
      
      return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({available_releases,
        total_files: files.length})
    };
      
    } catch (dirError) {
      return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({available_releases: { windows: [], mac: [], linux: [] },
        total_files: 0,
        message: 'Releases directory not accessible'})
    };
    }
    
  } catch (error) {
    console.error('Release listing error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Internal server error'})
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
    event.params = extractParams(event, 'download/engine/[platform]');
    
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
      case 'OPTIONS':
        if (typeof OPTIONS === 'function') {
          const result = await OPTIONS(event);
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
exports.options = OPTIONS;
