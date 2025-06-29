import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Check if Supabase environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with error handling
let supabase: SupabaseClient;

// Ensure Supabase is properly initialized with error handling
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables are missing. Authentication will not work properly.');
  throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
} else {
  // Initialize with actual credentials
  supabase = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Get the session token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const { agentId, agentName, agentConfig } = await request.json();

    // Validate required fields
    if (!agentId || !agentName) {
      return NextResponse.json(
        { error: 'Agent ID and name are required' },
        { status: 400 }
      );
    }

    // Insert or update agent record
    const { data, error: insertError } = await supabase
      .from('user_agents')
      .upsert([
        { 
          user_id: user.id,
          agent_id: agentId,
          agent_name: agentName,
          agent_config: agentConfig || {}
        }
      ], {
        onConflict: 'user_id,agent_id'
      })
      .select();

    if (insertError) {
      console.error('Agent registration error:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: data?.[0],
      message: 'Agent registered successfully'
    });
  } catch (err) {
    console.error('Agent registration error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the session token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user's agents
    const { data, error: selectError } = await supabase
      .from('user_agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (selectError) {
      console.error('Error fetching user agents:', selectError);
      return NextResponse.json(
        { error: selectError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      message: 'Agents retrieved successfully'
    });
  } catch (err) {
    console.error('Error fetching agents:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
