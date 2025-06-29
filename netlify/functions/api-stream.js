// Auto-generated Netlify function from Next.js API route
// Original route: /api/stream
// Generated: 2025-06-29T11:16:38.468Z

// NextResponse/NextRequest converted to native Netlify response format
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper function to get user from token
async function getUser(token: string | null) {
  if (!token) return { user: null };

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return { user, error };
  } catch (error) {
    return { user: null, error };
  }
}

// SSE response headers
const headers = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
};

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
  

  // Get token from query params
  const token = request.nextUrl.searchParams.get('token');
  
  // Verify user authentication
  const { user, error } = await getUser(token);
  
  if (error || !user) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Unauthorized'})
    };
  }

  // For Netlify compatibility, we need to handle SSE differently
  // This implementation will be transformed by the migration script
  
  // Create a TransformStream to handle SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Send initial connection message
  const initialMessage = {
    type: 'connection',
    data: { status: 'connected', userId: user.id },
    timestamp: new Date().toISOString()
  };
  
  writer.write(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`));

  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(async () => {
    try {
      const heartbeat = {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      };
      await writer.write(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
    } catch (e) {
      console.error('Error sending heartbeat:', e);
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval);
    writer.close();
  });

  return new NextResponse(stream.readable, { headers });
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
