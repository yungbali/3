import { NextResponse } from 'next/server';
import { StorageService } from '@/lib/services/storage';

export async function GET() {
  try {
    const storageService = new StorageService();
    
    if (!storageService.isEnabled()) {
      return NextResponse.json({ 
        podcasts: [], 
        message: 'Storage not configured. Set BLOB_READ_WRITE_TOKEN to enable.' 
      });
    }
    
    const podcasts = await storageService.listPodcasts();
    return NextResponse.json({ podcasts });
  } catch (error) {
    console.error('Failed to list podcasts:', error);
    return NextResponse.json(
      { error: 'Failed to list podcasts' },
      { status: 500 }
    );
  }
}
