import { AudioSegment } from '../types/podcast';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class AudioService {
  private tempDir: string;
  private ffmpegAvailable: boolean = true;

  constructor() {
    this.tempDir = os.tmpdir();
    this.checkFfmpeg();
  }

  private checkFfmpeg(): void {
    try {
      const { execSync } = require('child_process');
      execSync('which ffmpeg', { stdio: 'ignore' });
      console.log('   ✓ ffmpeg found');
      this.ffmpegAvailable = true;
    } catch {
      console.warn('   ⚠️ ffmpeg not found — using buffer concatenation fallback');
      this.ffmpegAvailable = false;
    }
  }

  private async writeSegmentToFile(segment: AudioSegment, index: number): Promise<string> {
    const filename = `segment-${index}-${uuidv4()}.mp3`;
    const filepath = path.join(this.tempDir, filename);
    await fs.promises.writeFile(filepath, segment.audioBuffer);
    return filepath;
  }

  private async cleanup(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.promises.unlink(file);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Simple buffer concatenation fallback when ffmpeg is not available.
   * Works for MP3 files since they can be naively concatenated.
   */
  private mergeBuffers(segments: AudioSegment[]): Buffer {
    console.log('   Using buffer concatenation (no ffmpeg)');
    const buffers = segments.map(s => s.audioBuffer);
    return Buffer.concat(buffers);
  }

  /**
   * Merge using ffmpeg concat demuxer for clean joins.
   */
  private async mergeWithFfmpeg(segments: AudioSegment[]): Promise<Buffer> {
    const ffmpeg = require('fluent-ffmpeg');
    const segmentFiles: string[] = [];
    const outputFile = path.join(this.tempDir, `output-${uuidv4()}.mp3`);
    const listFile = path.join(this.tempDir, `list-${uuidv4()}.txt`);

    try {
      // Write all segments to temp files
      for (let i = 0; i < segments.length; i++) {
        const filepath = await this.writeSegmentToFile(segments[i], i);
        segmentFiles.push(filepath);
      }

      // Build concat list file
      let listContent = '';
      for (const file of segmentFiles) {
        listContent += `file '${file}'\n`;
      }
      await fs.promises.writeFile(listFile, listContent);

      // Merge with a timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('ffmpeg merge timed out after 30 seconds'));
        }, 30000);

        ffmpeg()
          .input(listFile)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions(['-c', 'copy'])
          .output(outputFile)
          .on('error', (err: Error) => {
            clearTimeout(timeout);
            console.error('FFmpeg error:', err.message);
            reject(err);
          })
          .on('end', () => {
            clearTimeout(timeout);
            resolve();
          })
          .run();
      });

      const mergedBuffer = await fs.promises.readFile(outputFile);
      await this.cleanup([...segmentFiles, listFile, outputFile]);
      return mergedBuffer;
    } catch (error) {
      await this.cleanup([...segmentFiles, listFile, outputFile]);
      throw error;
    }
  }

  async mergeSegments(segments: AudioSegment[]): Promise<Buffer> {
    if (segments.length === 0) {
      throw new Error('No audio segments to merge');
    }

    if (segments.length === 1) {
      return segments[0].audioBuffer;
    }

    // Try ffmpeg first, fall back to buffer concat
    if (this.ffmpegAvailable) {
      try {
        return await this.mergeWithFfmpeg(segments);
      } catch (error) {
        console.warn('   ⚠️ ffmpeg merge failed, falling back to buffer concat:', 
          error instanceof Error ? error.message : error);
        this.ffmpegAvailable = false;
        return this.mergeBuffers(segments);
      }
    }

    return this.mergeBuffers(segments);
  }
}
