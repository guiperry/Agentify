const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role for server-side operations
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

// Helper function to get user from token
async function getUser(event) {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization header' };
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      return { user: null, error: error.message };
    }
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Validate existing token
      const { user, error } = await getUser(event);

      if (error || !user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid or expired token' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user, valid: true })
      };
    }

    if (event.httpMethod === 'POST') {
      const { email, password, action = 'signin' } = JSON.parse(event.body);

      if (action === 'signin') {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.message })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user: data.user,
            session: data.session
          })
        };
      }

      if (action === 'signup') {
        // Create new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.message })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user: data.user,
            session: data.session
          })
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Export helper function for other functions to use
exports.getUser = getUser;