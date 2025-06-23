import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Test endpoint called');
  return NextResponse.json({
    status: 'ok',
    message: 'API is available',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployment: 'netlify'
  });
}
