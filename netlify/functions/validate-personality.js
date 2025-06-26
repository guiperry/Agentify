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

    const personalityData = JSON.parse(event.body);
    const errors = [];

    // Validate personality traits
    if (!personalityData.traits || !Array.isArray(personalityData.traits)) {
      errors.push('Personality traits must be an array');
    } else {
      const validTraits = [
        'helpful', 'analytical', 'creative', 'logical', 'empathetic', 
        'professional', 'casual', 'formal', 'technical', 'educational',
        'patient', 'direct', 'detailed', 'concise', 'innovative'
      ];
      
      for (const trait of personalityData.traits) {
        if (!validTraits.includes(trait)) {
          errors.push(`Invalid personality trait: ${trait}. Valid traits: ${validTraits.join(', ')}`);
        }
      }

      if (personalityData.traits.length === 0) {
        errors.push('At least one personality trait is required');
      }

      if (personalityData.traits.length > 5) {
        errors.push('Maximum 5 personality traits allowed');
      }
    }

    // Validate communication style
    if (!personalityData.communicationStyle) {
      errors.push('Communication style is required');
    } else {
      const validStyles = ['professional', 'casual', 'formal', 'friendly', 'technical', 'educational'];
      if (!validStyles.includes(personalityData.communicationStyle)) {
        errors.push(`Invalid communication style. Valid styles: ${validStyles.join(', ')}`);
      }
    }

    // Validate tone
    if (personalityData.tone) {
      const validTones = ['neutral', 'enthusiastic', 'calm', 'authoritative', 'supportive', 'analytical'];
      if (!validTones.includes(personalityData.tone)) {
        errors.push(`Invalid tone. Valid tones: ${validTones.join(', ')}`);
      }
    }

    // Validate response length preference
    if (personalityData.responseLength) {
      const validLengths = ['brief', 'moderate', 'detailed', 'comprehensive'];
      if (!validLengths.includes(personalityData.responseLength)) {
        errors.push(`Invalid response length. Valid lengths: ${validLengths.join(', ')}`);
      }
    }

    // Validate custom instructions
    if (personalityData.customInstructions && personalityData.customInstructions.length > 1000) {
      errors.push('Custom instructions must be less than 1000 characters');
    }

    // Store validated data in Supabase
    if (errors.length === 0) {
      // Get existing config or create new one
      const { data: existingConfig } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const configData = existingConfig || { user_id: user.id };
      configData.personality = personalityData;
      configData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('agent_configs')
        .upsert(configData);

      if (error) {
        console.error('Supabase error:', error);
        errors.push('Failed to save personality configuration');
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: errors.length === 0,
        errors,
        data: errors.length === 0 ? personalityData : null
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
