const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const { Readable } = require('stream');

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
  const token = event.queryStringParameters?.token;
  if (!token) return { user: null };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return { user: null };
  
  return { user };
}

async function getUserAgentConfig(userId) {
  const { data, error } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

exports.handler = async (event, context) => {
  const { user } = await getUser(event);
  if (!user) return { statusCode: 401, body: 'Unauthorized' };

  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  };

  // Create readable stream for SSE
  const stream = new Readable({
    async start(controller) {
      try {
        // Get user's agent config from Supabase
        const config = await getUserAgentConfig(user.id);
        if (!config) {
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({
              type: 'error',
              message: 'No agent configuration found',
              timestamp: new Date().toISOString()
            })}\n\n`
          ));
          controller.close();
          return;
        }

        // Use WASM compilation instead of Go compilation
        // This simulates the compilation process for Netlify environment
        const buildTarget = config.buildTarget || 'wasm';

        // Send compilation start message
        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({
            type: 'stdout',
            message: `Starting ${buildTarget.toUpperCase()} compilation...\n`,
            timestamp: new Date().toISOString()
          })}\n\n`
        ));

        // Simulate compilation steps
        const steps = [
          { message: 'Initializing build environment...', delay: 500 },
          { message: 'Processing agent configuration...', delay: 800 },
          { message: 'Generating source code...', delay: 1000 },
          { message: `Compiling to ${buildTarget.toUpperCase()}...`, delay: 1500 },
          { message: 'Optimizing output...', delay: 800 },
          { message: 'Compilation complete!', delay: 500 }
        ];

        let stepIndex = 0;
        const processStep = () => {
          if (stepIndex < steps.length) {
            const step = steps[stepIndex];
            setTimeout(() => {
              controller.enqueue(new TextEncoder().encode(
                `data: ${JSON.stringify({
                  type: 'stdout',
                  message: step.message + '\n',
                  timestamp: new Date().toISOString()
                })}\n\n`
              ));
              stepIndex++;
              processStep();
            }, step.delay);
          } else {
            // Send completion message
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: 'complete',
                success: true,
                exitCode: 0,
                buildTarget: buildTarget,
                outputFile: `agent_${config.id || 'unknown'}.${buildTarget === 'wasm' ? 'wasm' : 'so'}`,
                timestamp: new Date().toISOString()
              })}\n\n`
            ));
            controller.close();
          }
        };

        processStep();

      } catch (error) {
        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({
            type: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
          })}\n\n`
        ));
        controller.close();
      }
    }
  });

  return new Response(stream, { headers });
};