// Auto-generated Netlify function from Next.js API route
// Original route: /api/agent/validate
// Generated: 2025-06-29T08:55:09.538Z

// NextResponse/NextRequest converted to native Netlify response format

interface AgentFacts {
  id: string;
  agent_name: string;
  capabilities: {
    modalities: string[];
    skills: string[];
  };
  endpoints: {
    static: string[];
    adaptive_resolver: {
      url: string;
      policies: string[];
    };
  };
  certification: {
    level: string;
    issuer: string;
    attestations: string[];
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
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
    console.log('Agent validation endpoint called');
    const body = requestBody;
    const { agentFacts } = body;

    console.log('Received agent facts:', agentFacts);

    if (!agentFacts) {
      console.log('No agent facts provided');
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({isValid: false,
        errors: { general: 'Agent facts are required' },
        warnings: {}})
    };
    }

    // Validate agent facts
    const validationResult = validateAgentFacts(agentFacts);

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Agent validation error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({isValid: false,
      errors: { general: 'Failed to validate agent facts' },
      warnings: {}})
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
