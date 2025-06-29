// Auto-generated Netlify function from Next.js API route
// Original route: /api/chat/gemini
// Generated: 2025-06-29T03:38:56.004Z

// NextResponse/NextRequest converted to native Netlify response format
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

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
    // Parse request body
    const body = requestBody;
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Invalid request body',
        response: 'The request body is missing or invalid.'})
    };
    }

    const { prompt, deploymentStep } = body;
    
    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Invalid prompt',
        response: 'The prompt is required and must be a string.'})
    };
    }
    
    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
    
    if (!apiKey) {
      return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Gemini API key not configured',
        response: 'API key not configured. Please set the GEMINI_API_KEY environment variable.'})
    };
    }
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Configure generation parameters
    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };
    
    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
    
    // Create system prompt based on deployment step
    let systemPrompt = "You are Agon, an AI deployment assistant that helps users deploy their applications.";
    
    if (deploymentStep) {
      systemPrompt += ` The user is currently in the ${deploymentStep} phase of the deployment process.`;
      
      switch (deploymentStep) {
        case 'dashboard':
          systemPrompt += " Focus on providing an overview of the project, explaining metrics, and guiding the user through the deployment process.";
          break;
        case 'repository':
          systemPrompt += " Focus on code analysis, identifying issues, and suggesting improvements to the codebase.";
          break;
        case 'compile':
          systemPrompt += " Focus on helping with compilation errors, build configuration, and optimizing the build process.";
          break;
        case 'tests':
          systemPrompt += " Focus on test results, fixing failing tests, and improving test coverage.";
          break;
        case 'deploy':
          systemPrompt += " Focus on deployment options, platforms, and troubleshooting deployment issues.";
          break;
      }
    }
    
    try {
      // Start chat and send message
      const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: [
          {
            role: "user",
            parts: [{ text: "Who are you and what can you help me with?" }],
          },
          {
            role: "model",
            parts: [{ text: systemPrompt }],
          },
        ],
      });
      
      const result = await chat.sendMessage(prompt);
      const response = result.response.text();
      
      return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({response})
    };
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Gemini API error',
        response: `Error communicating with Gemini API: ${(apiError).message}`})
    };
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Failed to generate AI response',
      response: `Error: ${(error).message}`})
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
