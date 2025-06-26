const { createClient } = require('@supabase/supabase-js');

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { user } = await getUser(event);
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const identityData = JSON.parse(event.body);
    const errors = [];

    // Comprehensive validation logic
    if (!identityData.name || typeof identityData.name !== 'string') {
      errors.push('Agent name is required');
    } else if (identityData.name.length < 3) {
      errors.push('Agent name must be at least 3 characters');
    } else if (identityData.name.length > 100) {
      errors.push('Agent name must be less than 100 characters');
    }

    if (!identityData.type || typeof identityData.type !== 'string') {
      errors.push('Agent type is required');
    } else {
      const validTypes = ['assistant', 'specialist', 'researcher', 'analyst', 'creative', 'technical'];
      if (!validTypes.includes(identityData.type)) {
        errors.push('Invalid agent type. Must be one of: ' + validTypes.join(', '));
      }
    }

    if (identityData.description && identityData.description.length > 500) {
      errors.push('Agent description must be less than 500 characters');
    }

    if (identityData.version && !/^\d+\.\d+\.\d+$/.test(identityData.version)) {
      errors.push('Agent version must follow semantic versioning (e.g., 1.0.0)');
    }

    // Store validated data in Supabase
    if (errors.length === 0) {
      const { error } = await supabase
        .from('agent_configs')
        .upsert({
          user_id: user.id,
          identity: identityData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Supabase error:', error);
        errors.push('Failed to save configuration');
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: errors.length === 0,
        errors,
        data: errors.length === 0 ? identityData : null
      })
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};