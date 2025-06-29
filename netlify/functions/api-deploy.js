// Auto-generated Netlify function from Next.js API route
// Original route: /api/deploy
// Generated: 2025-06-29T09:07:01.128Z

// NextResponse/NextRequest converted to native Netlify response format

interface DeploymentRequest {
  deploymentId: string;
  agentName: string;
  version: string;
  environment: 'staging' | 'production';
  deploymentType?: 'cloud' | 'blockchain-aws';
  pluginUrl?: string;
  jobId?: string;
  awsConfig?: {
    region: string;
    instanceType: string;
    keyPairName: string;
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
  

  try {
    const body: DeploymentRequest = requestBody;
    const { deploymentId, agentName, version, environment, deploymentType, pluginUrl, jobId, awsConfig } = body;

    // Validate required fields
    if (!deploymentId || !agentName || !version || !environment) {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Missing required fields, agentName, version, environment'})
    };
    }

    console.log(`Starting deployment: ${agentName} v${version} to ${environment}`);
    console.log(`Deployment ID: ${deploymentId}`);
    console.log(`Deployment Type: ${deploymentType || 'cloud'}`);

    if (deploymentType === 'blockchain-aws') {
      // Blockchain AWS deployment with Ansible
      if (!pluginUrl && !jobId) {
        return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Plugin URL or Job ID required for blockchain deployment'})
    };
      }

      console.log(`🔗 Starting blockchain deployment to AWS`);
      console.log(`Plugin source: ${pluginUrl || `GitHub Actions job ${jobId}`}`);

      if (awsConfig) {
        console.log(`AWS Config: Region=${awsConfig.region}, Instance=${awsConfig.instanceType}, KeyPair=${awsConfig.keyPairName}`);
      }

      // Start blockchain deployment process
      await startBlockchainDeployment({
        deploymentId,
        agentName,
        version,
        environment,
        pluginUrl,
        jobId,
        awsConfig
      });

      return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: true,
        deploymentId,
        message: `Blockchain deployment of ${agentName} v${version} to AWS ${environment} started`,
        status: 'initiated',
        deploymentType: 'blockchain-aws',
        estimatedTime: '10-15 minutes'})
    };

    } else {
      // Standard cloud deployment
      console.log(`☁️ Starting standard cloud deployment`);

      // Simulate deployment process
      setTimeout(() => {
        console.log(`Deployment ${deploymentId} completed successfully`);
      }, 5000);

      return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({success: true,
        deploymentId,
        message: `Deployment of ${agentName} v${version} to ${environment} started`,
        status: 'initiated',
        deploymentType: 'cloud'})
    };
    }

  } catch (error) {
    console.error('Deployment API error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Failed to process deployment request'})
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
