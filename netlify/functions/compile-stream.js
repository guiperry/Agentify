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

        // Start Go compilation process
        const goProcess = spawn('go', ['build', '-buildmode=plugin', '-o', 'agent.so', 'main.go'], {
          cwd: '/tmp/build'
        });

        // Stream stdout in real-time
        goProcess.stdout.on('data', (data) => {
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({
              type: 'stdout',
              message: data.toString(),
              timestamp: new Date().toISOString()
            })}\n\n`
          ));
        });

        // Stream stderr in real-time
        goProcess.stderr.on('data', (data) => {
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({
              type: 'stderr',
              message: data.toString(),
              timestamp: new Date().toISOString()
            })}\n\n`
          ));
        });

        // Handle completion
        goProcess.on('close', (code) => {
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({
              type: 'complete',
              success: code === 0,
              exitCode: code,
              timestamp: new Date().toISOString()
            })}\n\n`
          ));
          controller.close();
        });

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