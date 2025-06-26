const { createClient } = require('@supabase/supabase-js');
const { Readable } = require('stream');
const NetlifyAPI = require('netlify');

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

async function getLatestCompiledPlugin(userId) {
  const { data, error } = await supabase
    .from('compilation_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
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
        const netlifyClient = new NetlifyAPI(process.env.NETLIFY_ACCESS_TOKEN);
        const plugin = await getLatestCompiledPlugin(user.id);

        if (!plugin) {
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({
              type: 'error',
              message: 'No compiled plugin found',
              timestamp: new Date().toISOString()
            })}\n\n`
          ));
          controller.close();
          return;
        }

        // Start deployment
        const deploy = await netlifyClient.deploy(plugin.download_url, {
          draft: false,
          message: `Agent deployment for user ${user.id}`
        });

        // Stream deployment progress
        let lastProgress = 0;
        const interval = setInterval(async () => {
          const { state, deploy_time, error_message } = await netlifyClient.getDeploy(deploy.id);

          if (state === 'ready') {
            clearInterval(interval);
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: 'complete',
                success: true,
                url: deploy.deploy_url,
                timestamp: new Date().toISOString()
              })}\n\n`
            ));
            controller.close();
          } else if (state === 'error') {
            clearInterval(interval);
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: error_message,
                timestamp: new Date().toISOString()
              })}\n\n`
            ));
            controller.close();
          } else {
            const progress = Math.min(95, lastProgress + 5); // Simulate progress
            lastProgress = progress;
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: 'progress',
                progress,
                message: `Deploying (${state})...`,
                timestamp: new Date().toISOString()
              })}\n\n`
            ));
          }
        }, 1000);

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