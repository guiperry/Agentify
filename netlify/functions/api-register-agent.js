// Auto-generated Netlify function from Next.js API route
// Original route: /api/register-agent
// Generated: 2025-06-29T15:31:17.262Z

// NextResponse/NextRequest converted to native Netlify response format
const { createClient, SupabaseClient } = require('@supabase/supabase-js');

// Check if Supabase environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with error handling
let supabase;

// Ensure Supabase is properly initialized with error handling
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables are missing. Authentication will not work properly.');
  throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
} else {
  // Initialize with actual credentials
  supabase = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

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
  

  try {
    // Get the session token from the request
    const authHeader = event.headers["authorization"];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Authentication required'})
    };
    }

    const token = authHeader.substring(7);

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Invalid or expired token'})
    };
    }

    // Parse request body
    const { identity, personality, capabilities } = requestBody;

    // Validate required fields
    if (!identity || !personality) {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Identity and personality are required'})
    };
    }

    // Insert or update agent record
    const { data, error: insertError } = await supabase
      .from('agent_configs')
      .upsert([
        {
          user_id: user.id,
          identity: identity || {},
          personality: personality || {},
          capabilities: capabilities || {}
        }
      ], {
        onConflict: 'user_id'
      })
      .select();

    if (insertError) {
      console.error('Agent config registration error:', insertError);
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: insertError.message})
    };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: true,
      data: data?.[0],
      message: 'Agent configuration saved successfully'})
    };
  } catch (err) {
    console.error('Agent registration error:', err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: err instanceof Error ? err.message : 'Unknown error'})
    };
  }
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
  

  try {
    // Get the session token from the request
    const authHeader = event.headers["authorization"];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Authentication required'})
    };
    }

    const token = authHeader.substring(7);

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Invalid or expired token'})
    };
    }

    // Get user's agent configs
    const { data, error: selectError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (selectError) {
      console.error('Error fetching user agent configs:', selectError);
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: selectError.message})
    };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: true,
      data,
      message: 'Agent configurations retrieved successfully'})
    };
  } catch (err) {
    console.error('Error fetching agent configs:', err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: err instanceof Error ? err.message : 'Unknown error'})
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
  

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
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
exports.post = POST;
exports.get = GET;
exports.options = OPTIONS;
