import { NextRequest } from 'next/server';
import { LLMService } from '@/lib/services/llm';
import { TTSService } from '@/lib/services/tts';
import { AudioService } from '@/lib/services/audio';
import { StorageService } from '@/lib/services/storage';
import { GenerateRequest, PodcastScript, ResearchNotes } from '@/lib/types/podcast';

// Vercel serverless function config - extend timeout for podcast generation
export const maxDuration = 300; // 5 minutes max (requires Vercel Pro for >60s)

// Services initialized per request in serverless
function getServices() {
  return {
    llmService: new LLMService(),
    ttsService: new TTSService(),
    audioService: new AudioService(),
    storageService: new StorageService(),
  };
}

// Helper to create SSE message
function createSSEMessage(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send SSE events
  const sendEvent = async (event: string, data: object) => {
    await writer.write(encoder.encode(createSSEMessage(event, data)));
  };

  // Process generation in the background
  (async () => {
    try {
      const body = await request.json() as GenerateRequest;
      const { topic, tone, duration } = body;

      // Validate request
      if (!topic || !tone || !duration) {
        await sendEvent('error', { 
          error: 'Missing required fields', 
          required: ['topic', 'tone', 'duration'] 
        });
        await writer.close();
        return;
      }

      if (!['casual', 'educational', 'humorous'].includes(tone)) {
        await sendEvent('error', { error: 'Invalid tone. Must be: casual, educational, or humorous' });
        await writer.close();
        return;
      }

      if (!['short', 'medium'].includes(duration)) {
        await sendEvent('error', { error: 'Invalid duration. Must be: short or medium' });
        await writer.close();
        return;
      }

      // Initialize services
      const { llmService, ttsService, audioService, storageService } = getServices();
      const modelInfo = llmService.getModelInfo();
      const storageEnabled = storageService.isEnabled();

      console.log(`\n🎙️ Starting podcast generation (streaming)...`);
      console.log(`   Topic: ${topic}`);
      console.log(`   Model: ${modelInfo.model} (${modelInfo.provider})`);

      // Send initial status
      await sendEvent('status', { 
        step: 'started', 
        message: 'Starting podcast generation',
        model: modelInfo.model,
        provider: modelInfo.provider
      });

      // Step 1: Validate topic
      await sendEvent('status', { step: 'validating', message: 'Analyzing topic...' });
      console.log('\n📋 Step 1: Validating topic...');
      
      const validation = await llmService.validateTopic(topic);
      
      if (!validation.isValid) {
        await sendEvent('error', { 
          error: 'Invalid topic', 
          reason: validation.reason 
        });
        await writer.close();
        return;
      }
      
      await sendEvent('validated', { 
        step: 'validated',
        cleanedTopic: validation.cleanedTopic,
        message: `Topic validated: "${validation.cleanedTopic}"`
      });
      console.log(`   ✓ Topic validated: "${validation.cleanedTopic}"`);

      // Step 2: Generate research
      await sendEvent('status', { step: 'researching', message: 'Generating research...' });
      console.log('\n📚 Step 2: Generating research...');
      
      const research: ResearchNotes = await llmService.generateResearch(
        validation.cleanedTopic, 
        tone, 
        duration
      );
      
      await sendEvent('researched', { 
        step: 'researched',
        keyPointsCount: research.keyPoints.length,
        factsCount: research.facts.length,
        message: `Research complete: ${research.keyPoints.length} key points`
      });
      console.log(`   ✓ Research complete: ${research.keyPoints.length} key points`);

      // Step 3: Generate script
      await sendEvent('status', { step: 'scripting', message: 'Writing script...' });
      console.log('\n✍️ Step 3: Writing script...');
      
      const script: PodcastScript = await llmService.generateScript(research, tone, duration);
      
      await sendEvent('scripted', { 
        step: 'scripted',
        title: script.title,
        speakers: script.speakers.map(s => ({ name: s.name, personality: s.personality })),
        lineCount: script.lines.length,
        message: `Script complete: "${script.title}" with ${script.lines.length} lines`
      });
      console.log(`   ✓ Script complete: "${script.title}" with ${script.lines.length} lines`);

      // Step 4: Generate audio for each line with progress
      await sendEvent('status', { 
        step: 'generating_audio', 
        message: 'Generating audio...',
        totalLines: script.lines.length
      });
      console.log('\n🔊 Step 4: Generating audio...');
      
      const audioSegments = await ttsService.generateAudioForScript(
        script,
        async (current, total, speaker, emotion) => {
          await sendEvent('audio_progress', {
            step: 'generating_audio',
            current,
            total,
            speaker,
            emotion,
            message: `Generating line ${current}/${total}: ${speaker} (${emotion})`
          });
        }
      );
      
      await sendEvent('audio_complete', { 
        step: 'audio_complete',
        segmentCount: audioSegments.length,
        message: `Audio generated: ${audioSegments.length} segments`
      });
      console.log(`   ✓ Audio generated: ${audioSegments.length} segments`);

      // Step 5: Merge audio segments
      await sendEvent('status', { step: 'merging', message: 'Merging audio segments...' });
      console.log('\n🎵 Step 5: Merging audio...');
      
      const finalAudio = await audioService.mergeSegments(audioSegments);
      
      console.log(`   ✓ Final audio ready: ${(finalAudio.length / 1024).toFixed(1)} KB`);

      // Step 6: Upload to storage (if enabled)
      let audioUrl: string | null = null;
      if (storageEnabled) {
        await sendEvent('status', { step: 'uploading', message: 'Uploading to cloud storage...' });
        console.log('\n☁️ Step 6: Uploading to Vercel Blob...');
        
        const stored = await storageService.uploadPodcast(finalAudio, script.title, {
          topic: validation.cleanedTopic,
          tone,
          duration,
          lineCount: script.lines.length,
        });
        
        audioUrl = stored.url;
        console.log(`   ✓ Uploaded: ${audioUrl}`);
      }

      // Send complete event with audio URL or base64 fallback
      await sendEvent('complete', { 
        step: 'complete',
        title: script.title,
        speakers: script.speakers.map(s => ({ name: s.name, personality: s.personality })),
        lineCount: script.lines.length,
        audioSize: finalAudio.length,
        // Prefer URL if storage is enabled, fall back to base64
        audioUrl: audioUrl,
        audioBase64: storageEnabled ? undefined : finalAudio.toString('base64'),
        message: 'Podcast generation complete!'
      });
      
      console.log('\n✅ Podcast generation complete! Sent to client.\n');
      await writer.close();

    } catch (error) {
      console.error('Generation error:', error);
      await sendEvent('error', { 
        error: 'Failed to generate podcast', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
      await writer.close();
    }
  })();

  // Return streaming response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
