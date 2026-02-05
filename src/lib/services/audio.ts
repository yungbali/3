import { AudioSegment } from '../types/podcast';

/**
 * Audio service for merging audio segments.
 * Uses simple buffer concatenation which works for MP3 files
 * (MP3 is frame-based, so concatenation produces valid audio).
 * 
 * This approach avoids FFmpeg dependency for serverless compatibility.
 */
export class AudioService {
  /**
   * Merge multiple audio segments into a single buffer.
   * Uses simple concatenation which works for MP3 format.
   */
  async mergeSegments(segments: AudioSegment[]): Promise<Buffer> {
    if (segments.length === 0) {
      throw new Error('No audio segments to merge');
    }

    // If only one segment, return it directly
    if (segments.length === 1) {
      return segments[0].audioBuffer;
    }

    // Calculate total size
    const totalSize = segments.reduce((sum, seg) => sum + seg.audioBuffer.length, 0);
    console.log(`🎵 Merging ${segments.length} segments (${(totalSize / 1024).toFixed(1)} KB total)`);

    // Concatenate all buffers
    const mergedBuffer = Buffer.concat(
      segments.map(seg => seg.audioBuffer),
      totalSize
    );

    console.log(`   ✓ Merged audio: ${(mergedBuffer.length / 1024).toFixed(1)} KB`);
    return mergedBuffer;
  }
}
