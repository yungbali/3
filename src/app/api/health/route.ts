import { NextResponse } from 'next/server';

export async function GET() {
  const storageConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

  return NextResponse.json({
    status: 'healthy',
    service: 'kotomo',
    version: '1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    storage: {
      configured: storageConfigured,
      type: storageConfigured ? 'vercel-blob' : 'none',
    },
  });
}
