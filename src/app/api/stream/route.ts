import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper function to get user from token
async function getUser(token: string | null) {
  if (!token) return { user: null };

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return { user, error };
  } catch (error) {
    return { user: null, error };
  }
}

// SSE response headers
const headers = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
};

export async function GET(request: NextRequest) {
  // Get token from query params
  const token = request.nextUrl.searchParams.get('token');
  
  // Verify user authentication
  const { user, error } = await getUser(token);
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Create a TransformStream to handle SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Send initial connection message
  const initialMessage = {
    type: 'connection',
    data: { status: 'connected', userId: user.id },
    timestamp: new Date().toISOString()
  };
  
  writer.write(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`));

  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(async () => {
    try {
      const heartbeat = {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      };
      await writer.write(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
    } catch (e) {
      console.error('Error sending heartbeat:', e);
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval);
    writer.close();
  });

  return new NextResponse(stream.readable, { headers });
}