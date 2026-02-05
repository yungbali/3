import ffmpeg from 'fluent-ffmpeg';
import { AudioSegment } from '../types/podcast';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class AudioService {
  private tempDir: string;

  constructor() {
    // Use system temp directory (works on Render)
    this.tempDir = os.tmpdir();
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
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  async mergeSegments(segments: AudioSegment[]): Promise<Buffer> {
    if (segments.length === 0) {
      throw new Error('No audio segments to merge');
    }

    // If only one segment, return it directly
    if (segments.length === 1) {
      return segments[0].audioBuffer;
    }

    const segmentFiles: string[] = [];
    const outputFile = path.join(this.tempDir, `output-${uuidv4()}.mp3`);
    const listFile = path.join(this.tempDir, `list-${uuidv4()}.txt`);

    try {
      // Write all segments to temp files
      for (let i = 0; i < segments.length; i++) {
        const filepath = await this.writeSegmentToFile(segments[i], i);
        segmentFiles.push(filepath);
      }

      // Build concat list file (ffmpeg concat demuxer format)
      let listContent = '';
      
      for (let i = 0; i < segmentFiles.length; i++) {
        listContent += `file '${segmentFiles[i]}'\n`;
      }
      
      await fs.promises.writeFile(listFile, listContent);

      // Merge using ffmpeg concat demuxer
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(listFile)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions(['-c', 'copy'])
          .output(outputFile)
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
          })
          .on('end', () => {
            resolve();
          })
          .run();
      });

      // Read the merged file
      const mergedBuffer = await fs.promises.readFile(outputFile);

      // Cleanup all temp files
      await this.cleanup([...segmentFiles, listFile, outputFile]);

      return mergedBuffer;
    } catch (error) {
      // Cleanup on error
      await this.cleanup([...segmentFiles, listFile, outputFile]);
      throw error;
    }
  }
}
