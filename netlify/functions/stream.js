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
      // Get user's agent config
      const config = await getUserAgentConfig(user.id);
      
      // Create SSE response with connection confirmation
      const sseData = JSON.stringify({
        type: 'connection',
        message: 'SSE connection established',
        timestamp: new Date().toISOString(),
        userId: user.id,
        hasConfig: !!config
      });

      const response = `data: ${sseData}\n\n`;

      return {
        statusCode: 200,
        headers,
        body: response
      };
    } catch (error) {
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
