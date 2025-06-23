import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db-service';

// GET /api/chat/sessions - Get all chat sessions
export async function GET() {
  try {
    const sessions = await dbService.query(
      'SELECT id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC'
    );
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions - Create a new chat session
export async function POST(request: NextRequest) {
  try {
    const { title, metadata, messages } = await request.json();
    
    // Create session
    const result = await dbService.query(
      'INSERT INTO chat_sessions (title, metadata) VALUES (?, ?)',
      [title, JSON.stringify(metadata || {})]
    );
    
    const sessionId = result.insertId;
    
    // Add messages if provided
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        await dbService.query(
          'INSERT INTO chat_messages (session_id, content, role, type, timestamp) VALUES (?, ?, ?, ?, ?)',
          [
            sessionId,
            msg.content,
            msg.role,
            msg.type || null,
            msg.timestamp || new Date().toISOString()
          ]
        );
      }
    }
    
    return NextResponse.json({ sessionId }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}
