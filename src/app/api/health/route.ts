import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Health check endpoint called');
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployment: 'netlify'
  });
}