const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to get user from token
async function getUser(event) {
  const token = event.queryStringParameters?.token;
  if (!token) return { user: null };

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return { user, error };
  } catch (error) {
    return { user: null, error };
  }
}

// Helper function to get user's agent config
async function getUserAgentConfig(userId) {
  try {
    const { data, error } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching agent config:', error);
    return null;
  }
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  const { user } = await getUser(event);
  if (!user) {
    return { 
      statusCode: 401, 
      body: JSON.stringify({ error: 'Unauthorized' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  };

  // Handle POST requests for triggering compilation
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      
      if (body.type === 'start_process_configuration') {
        // Store the compilation request in Supabase for processing
        const { error } = await supabase
          .from('compilation_requests')
          .insert({
            user_id: user.id,
            config: body.data,
            status: 'pending',
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ success: true, message: 'Compilation request queued' })
        };
      }
    } catch (error) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // Handle GET requests for SSE stream
  if (event.httpMethod === 'GET') {
    try {
      console.log(`SSE connection established for user: ${user.id}`);
      
      // Get user's agent config
      const config = await getUserAgentConfig(user.id);
      
      // Log connection details
      console.log(`SSE connection details:`, {
        userId: user.id,
        hasConfig: !!config,
        origin: event.headers.origin || event.headers.Origin || 'unknown',
        referer: event.headers.referer || event.headers.Referer || 'unknown',
        userAgent: event.headers['user-agent'] || event.headers['User-Agent'] || 'unknown'
      });
      
      // Create SSE response with connection confirmation and heartbeat
      // The heartbeat is important to keep the connection alive
      const initialMessage = JSON.stringify({
        type: 'connection',
        message: 'SSE connection established',
        timestamp: new Date().toISOString(),
        userId: user.id,
        hasConfig: !!config
      });
      
      // Add a heartbeat message to ensure the client receives multiple messages
      // This helps prevent the connection from closing prematurely
      const heartbeatMessage = JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      });

      // Combine initial message and heartbeat
      const response = `data: ${initialMessage}\n\n` + 
                       `data: ${heartbeatMessage}\n\n`;

      return {
        statusCode: 200,
        headers,
        body: response
      };
    } catch (error) {
      console.error('Error in SSE stream handler:', error);
      console.error('SSE error details:', {
        userId: user?.id || 'unknown',
        errorMessage: error.message,
        errorStack: error.stack,
        origin: event.headers.origin || event.headers.Origin || 'unknown',
        referer: event.headers.referer || event.headers.Referer || 'unknown'
      });
      
      const errorData = JSON.stringify({
        type: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });

      return {
        statusCode: 200,
        headers,
        body: `data: ${errorData}\n\n`
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
