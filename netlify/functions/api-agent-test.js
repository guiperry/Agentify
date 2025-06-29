// Auto-generated Netlify function from Next.js API route
// Original route: /api/agent/test
// Generated: 2025-06-29T08:55:09.534Z

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

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

interface TestResponse {
  success: boolean;
  testResults: {
    passed: number;
    failed: number;
    total: number;
    coverage: number;
    details: TestResult[];
  };
  logs: string[];
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
    const body = requestBody;
    const { config, repoUrl } = body;

    if (!config) {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
        testResults: {
          passed: 0,
          failed: 1,
          total: 1,
          coverage: 0,
          details: [{
            name: 'Configuration Test',
            status: 'failed',
            duration: 0,
            error: 'Missing agent configuration'
          }]
        },
        logs: ['Error: Missing agent configuration']})
    };
    }

    // Simulate testing the agent configuration
    const testResults = await runAgentTests(config, repoUrl);

    return NextResponse.json(testResults);
  } catch (error) {
    console.error('Agent testing error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: false,
      testResults: {
        passed: 0,
        failed: 1,
        total: 1,
        coverage: 0,
        details: [{
          name: 'System Test',
          status: 'failed',
          duration: 0,
          error: error instanceof Error ? error.message : 'Testing failed'
        }]
      },
      logs: [`Error: ${error instanceof Error ? error.message : 'Testing failed'}`]})
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
