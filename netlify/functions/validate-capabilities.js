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

    const capabilitiesData = JSON.parse(event.body);
    const errors = [];

    // Validate web browsing capability
    if (typeof capabilitiesData.canBrowseWeb !== 'boolean') {
      errors.push('Web browsing capability must be a boolean value');
    }

    // Validate code execution capability
    if (typeof capabilitiesData.canExecuteCode !== 'boolean') {
      errors.push('Code execution capability must be a boolean value');
    }

    // Validate file access capability
    if (typeof capabilitiesData.canAccessFiles !== 'boolean') {
      errors.push('File access capability must be a boolean value');
    }

    // Validate memory limit
    if (capabilitiesData.maxMemory) {
      const validMemoryOptions = ['256MB', '512MB', '1GB', '2GB', '4GB'];
      if (!validMemoryOptions.includes(capabilitiesData.maxMemory)) {
        errors.push(`Invalid memory limit. Valid options: ${validMemoryOptions.join(', ')}`);
      }
    }

    // Validate timeout settings
    if (capabilitiesData.timeoutSeconds) {
      const timeout = parseInt(capabilitiesData.timeoutSeconds);
      if (isNaN(timeout) || timeout < 10 || timeout > 300) {
        errors.push('Timeout must be between 10 and 300 seconds');
      }
    }

    // Validate supported languages
    if (capabilitiesData.supportedLanguages && Array.isArray(capabilitiesData.supportedLanguages)) {
      const validLanguages = [
        'javascript', 'python', 'go', 'rust', 'java', 'cpp', 'csharp', 
        'php', 'ruby', 'swift', 'kotlin', 'typescript', 'sql', 'bash'
      ];
      
      for (const lang of capabilitiesData.supportedLanguages) {
        if (!validLanguages.includes(lang)) {
          errors.push(`Invalid programming language: ${lang}. Valid languages: ${validLanguages.join(', ')}`);
        }
      }

      if (capabilitiesData.supportedLanguages.length > 10) {
        errors.push('Maximum 10 supported languages allowed');
      }
    }

    // Validate API integrations
    if (capabilitiesData.apiIntegrations && Array.isArray(capabilitiesData.apiIntegrations)) {
      const validIntegrations = [
        'openai', 'anthropic', 'google', 'github', 'slack', 'discord', 
        'notion', 'airtable', 'zapier', 'webhooks'
      ];
      
      for (const integration of capabilitiesData.apiIntegrations) {
        if (!validIntegrations.includes(integration)) {
          errors.push(`Invalid API integration: ${integration}. Valid integrations: ${validIntegrations.join(', ')}`);
        }
      }
    }

    // Validate security settings
    if (capabilitiesData.securityLevel) {
      const validSecurityLevels = ['low', 'medium', 'high', 'maximum'];
      if (!validSecurityLevels.includes(capabilitiesData.securityLevel)) {
        errors.push(`Invalid security level. Valid levels: ${validSecurityLevels.join(', ')}`);
      }
    }

    // Validate network access
    if (typeof capabilitiesData.networkAccess !== 'boolean') {
      errors.push('Network access capability must be a boolean value');
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
      configData.capabilities = capabilitiesData;
      configData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('agent_configs')
        .upsert(configData);

      if (error) {
        console.error('Supabase error:', error);
        errors.push('Failed to save capabilities configuration');
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: errors.length === 0,
        errors,
        data: errors.length === 0 ? capabilitiesData : null
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
