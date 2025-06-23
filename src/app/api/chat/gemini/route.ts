import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json({
        error: 'Invalid request body',
        response: 'The request body is missing or invalid.'
      }, { status: 400 });
    }

    const { prompt, deploymentStep } = body;
    
    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({
        error: 'Invalid prompt',
        response: 'The prompt is required and must be a string.'
      }, { status: 400 });
    }
    
    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured',
        response: 'API key not configured. Please set the GEMINI_API_KEY environment variable.'
      }, { status: 400 });
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
      
      return NextResponse.json({ response });
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      return NextResponse.json({ 
        error: 'Gemini API error',
        response: `Error communicating with Gemini API: ${(apiError as Error).message}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return NextResponse.json({ 
      error: 'Failed to generate AI response',
      response: `Error: ${(error as Error).message}`
    }, { status: 500 });
  }
}
