import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db-service';

// GET /api/chat/sessions/[id] - Get a specific chat session with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate session ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    // Get session details
    const session = await dbService.query(
      'SELECT id, title, metadata, created_at, updated_at FROM chat_sessions WHERE id = ?',
      [id]
    );
    
    if (!session || session.length === 0) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }
    
    // Parse metadata JSON with error handling
    let metadata = {};
    try {
      if (session[0].metadata && typeof session[0].metadata === 'string') {
        metadata = JSON.parse(session[0].metadata);
      }
    } catch (jsonError) {
      console.error('Error parsing session metadata:', jsonError);
      // Continue with empty metadata rather than failing the request
    }
    
    const sessionData = {
      ...session[0],
      metadata
    };
    
    // Get messages for this session
    const messages = await dbService.query(
      'SELECT id, content, role, type, timestamp FROM chat_messages WHERE session_id = ? ORDER BY timestamp',
      [id]
    );
    
    return NextResponse.json({ ...sessionData, messages });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    );
  }
}

// PUT /api/chat/sessions/[id] - Update an existing chat session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { title, metadata, messages } = await request.json();
    
    // Update session
    await dbService.query(
      'UPDATE chat_sessions SET title = ?, metadata = ? WHERE id = ?',
      [title, JSON.stringify(metadata || {}), id]
    );
    
    // Delete existing messages
    await dbService.query(
      'DELETE FROM chat_messages WHERE session_id = ?', 
      [id]
    );
    
    // Add new messages
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        await dbService.query(
          'INSERT INTO chat_messages (session_id, content, role, type, timestamp) VALUES (?, ?, ?, ?, ?)',
          [
            id,
            msg.content,
            msg.role,
            msg.type || null,
            msg.timestamp || new Date().toISOString()
          ]
        );
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/sessions/[id] - Delete a chat session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Delete session (messages will be deleted via ON DELETE CASCADE)
    await dbService.query(
      'DELETE FROM chat_sessions WHERE id = ?', 
      [id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
