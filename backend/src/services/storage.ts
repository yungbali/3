import { put, del, list } from '@vercel/blob';

export interface StoredPodcast {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

export class StorageService {
  private blobToken: string;

  constructor() {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.warn('⚠️ BLOB_READ_WRITE_TOKEN not set - storage will be disabled');
    }
    this.blobToken = token || '';
  }

  isEnabled(): boolean {
    return !!this.blobToken;
  }

  /**
   * Upload a podcast audio file to Vercel Blob storage
   */
  async uploadPodcast(
    audioBuffer: Buffer,
    title: string,
    metadata?: {
      topic?: string;
      tone?: string;
      duration?: string;
      lineCount?: number;
    }
  ): Promise<StoredPodcast> {
    if (!this.isEnabled()) {
      throw new Error('Storage is not configured. Set BLOB_READ_WRITE_TOKEN environment variable.');
    }

    // Create a safe filename from the title
    const safeTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    
    const timestamp = Date.now();
    const filename = `podcasts/${safeTitle}-${timestamp}.mp3`;

    console.log(`📤 Uploading podcast to Vercel Blob: ${filename}`);

    const blob = await put(filename, audioBuffer, {
      access: 'public',
      token: this.blobToken,
      contentType: 'audio/mpeg',
      addRandomSuffix: false,
    });

    console.log(`   ✓ Uploaded: ${blob.url} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: audioBuffer.length,
      uploadedAt: new Date(),
    };
  }

  /**
   * Delete a podcast from storage
   */
  async deletePodcast(url: string): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('Storage is not configured');
    }

    await del(url, { token: this.blobToken });
    console.log(`🗑️ Deleted podcast: ${url}`);
  }

  /**
   * List all stored podcasts
   */
  async listPodcasts(limit = 100): Promise<Array<{ url: string; pathname: string; size: number; uploadedAt: Date }>> {
    if (!this.isEnabled()) {
      return [];
    }

    const { blobs } = await list({
      token: this.blobToken,
      prefix: 'podcasts/',
      limit,
    });

    return blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: new Date(blob.uploadedAt),
    }));
  }
}
