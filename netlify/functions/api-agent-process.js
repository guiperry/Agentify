// Auto-generated Netlify function from Next.js API route
// Original route: /api/agent/process
// Generated: 2025-06-29T15:31:17.204Z

// NextResponse/NextRequest converted to native Netlify response format

interface AgentConfiguration {
  name: string;
  type: string;
  personality: string;
  instructions: string;
  features: string[];
  agentFacts: any;
  settings: {
    creativity: number;
    mcpServers: any[];
  };
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
}

interface ProcessingResult {
  success: boolean;
  steps: ProcessingStep[];
  errors?: string[];
  warnings?: string[];
  compiledAgent?: {
    id: string;
    name: string;
    version: string;
    size: string;
    downloadUrl: string;
  };
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
  

  console.log('🚀 API /agent/process called');
  try {
    const body = requestBody;
    const { config, repoUrl, timestamp } = body;
    console.log('📝 Request body received:', { config: config?.name, repoUrl, timestamp });

    if (!config) {
      console.log('❌ Missing agent configuration');
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
        steps: [],
        errors: ['Missing agent configuration']})
    };
    }

    console.log('🔄 Starting process configuration with WebSocket updates');
    // Process configuration with WebSocket updates
    const result = await processAgentConfigurationWithWebSocket(config, repoUrl);
    console.log('✅ Process configuration completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Agent processing error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
      steps: [],
      errors: [error instanceof Error ? error.message : 'Processing failed']})
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
