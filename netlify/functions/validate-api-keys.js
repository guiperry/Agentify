const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

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

function encryptApiKey(key) {
  // Simple encryption for demo - in production use proper key management
  const encryptionKey = process.env.API_KEY_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey.padEnd(32, '0').substring(0, 32)),
    iv
  );
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), encryptedKey: encrypted };
}

// API key validation functions
async function testOpenAIKey(key) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testAnthropicKey(key) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    return response.status !== 401;
  } catch {
    return false;
  }
}

async function testGoogleKey(key) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    return response.ok;
  } catch {
    return false;
  }
}

async function testCerebrasKey(key) {
  try {
    const response = await fetch('https://api.cerebras.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testDeepseekKey(key) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function getUser(event) {
  const token = event.headers['authorization']?.split(' ')[1];
  if (!token) return { user: null };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return { user: null };
  
  return { user };
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

    const apiKeys = JSON.parse(event.body);
    const errors = [];
    const encryptedKeys = {};
    const validationResults = {};

    // Validate all provided API keys
    const keyValidators = {
      openai: testOpenAIKey,
      anthropic: testAnthropicKey,
      google: testGoogleKey,
      cerebras: testCerebrasKey,
      deepseek: testDeepseekKey
    };

    for (const [provider, key] of Object.entries(apiKeys)) {
      if (key && keyValidators[provider]) {
        const isValid = await keyValidators[provider](key);
        validationResults[provider] = isValid;

        if (!isValid) {
          errors.push(`Invalid ${provider} API key`);
        } else {
          encryptedKeys[provider] = encryptApiKey(key);
        }
      }
    }

    // Store encrypted API keys in Supabase if validation passed
    if (errors.length === 0 && Object.keys(encryptedKeys).length > 0) {
      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          encrypted_keys: encryptedKeys,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Supabase error:', error);
        errors.push('Failed to save API keys');
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: errors.length === 0,
        errors,
        validationResults,
        keysStored: Object.keys(encryptedKeys)
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