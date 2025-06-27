// Auto-generated Netlify function from Next.js API route
// Original route: /api/download/plugin/[filename]
// Generated: 2025-06-27T19:32:14.145Z

// NextResponse/NextRequest converted to native Netlify response format
const { readFile, stat } = require('fs/promises');
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
    const { filename } = params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Invalid filename'})
    };
    }
    
    // Ensure the file has a valid plugin extension
    const validExtensions = ['.so', '.dll', '.dylib'];
    const hasValidExtension = validExtensions.some(ext => filename.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Invalid file type. Only plugin files (.so, .dll, .dylib) are allowed.'})
    };
    }
    
    // Construct the file path
    const pluginsDir = join(process.cwd(), 'public', 'output', 'plugins');
    const filePath = join(pluginsDir, filename);
    
    try {
      // Check if file exists and get stats
      const fileStats = await stat(filePath);
      
      if (!fileStats.isFile()) {
        return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'File not found'})
    };
      }
      
      // Read the file
      const fileBuffer = await readFile(filePath);
      
      // Determine content type based on extension
      let contentType = 'application/octet-stream';
      if (filename.endsWith('.so')) {
        contentType = 'application/x-sharedlib';
      } else if (filename.endsWith('.dll')) {
        contentType = 'application/x-msdownload';
      } else if (filename.endsWith('.dylib')) {
        contentType = 'application/x-mach-binary';
      }
      
      // Create response with appropriate headers
      const response = new NextResponse(fileBuffer);
      response.headers.set('Content-Type', contentType);
      response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      response.headers.set('Content-Length', fileStats.size.toString());
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      return response;
      
    } catch (fileError) {
      console.error('File access error:', fileError);
      return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'File not found'})
    };
    }
    
  } catch (error) {
    console.error('Plugin download error:', error);
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
    event.params = extractParams(event, 'download/plugin/[filename]');
    
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
