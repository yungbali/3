import { Router, Request, Response } from 'express';
import { GenerateRequest, PodcastScript, ResearchNotes } from '../types/podcast';
import { LLMService } from '../services/llm';
import { TTSService } from '../services/tts';
import { AudioService } from '../services/audio';
import { StorageService } from '../services/storage';

const router = Router();

// Services initialized lazily on first request
let llmService: LLMService | null = null;
let ttsService: TTSService | null = null;
let audioService: AudioService | null = null;
let storageService: StorageService | null = null;

function getServices() {
  if (!llmService) llmService = new LLMService();
  if (!ttsService) ttsService = new TTSService();
  if (!audioService) audioService = new AudioService();
  if (!storageService) storageService = new StorageService();
  return { llmService, ttsService, audioService, storageService };
}

// Helper to send SSE events
function sendEvent(res: Response, event: string, data: object) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// POST /api/generate/stream - Generate podcast with real-time progress (SSE)
router.post('/generate/stream', async (req: Request, res: Response) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  try {
    const { topic, tone, duration }: GenerateRequest = req.body;

    // Validate request
    if (!topic || !tone || !duration) {
      sendEvent(res, 'error', { 
        error: 'Missing required fields', 
        required: ['topic', 'tone', 'duration'] 
      });
      return res.end();
    }

    if (!['casual', 'educational', 'humorous'].includes(tone)) {
      sendEvent(res, 'error', { error: 'Invalid tone. Must be: casual, educational, or humorous' });
      return res.end();
    }

    if (!['short', 'medium'].includes(duration)) {
      sendEvent(res, 'error', { error: 'Invalid duration. Must be: short or medium' });
      return res.end();
    }

    // Initialize services
    const { llmService, ttsService, audioService, storageService } = getServices();
    const modelInfo = llmService.getModelInfo();
    const storageEnabled = storageService.isEnabled();

    console.log(`\n🎙️ Starting podcast generation (streaming)...`);
    console.log(`   Topic: ${topic}`);
    console.log(`   Model: ${modelInfo.model} (${modelInfo.provider})`);

    // Send initial status
    sendEvent(res, 'status', { 
      step: 'started', 
      message: 'Starting podcast generation',
      model: modelInfo.model,
      provider: modelInfo.provider
    });

    // Step 1: Validate topic
    sendEvent(res, 'status', { step: 'validating', message: 'Analyzing topic...' });
    console.log('\n📋 Step 1: Validating topic...');
    
    const validation = await llmService.validateTopic(topic);
    
    if (!validation.isValid) {
      sendEvent(res, 'error', { 
        error: 'Invalid topic', 
        reason: validation.reason 
      });
      return res.end();
    }
    
    sendEvent(res, 'validated', { 
      step: 'validated',
      cleanedTopic: validation.cleanedTopic,
      message: `Topic validated: "${validation.cleanedTopic}"`
    });
    console.log(`   ✓ Topic validated: "${validation.cleanedTopic}"`);

    // Step 2: Generate research
    sendEvent(res, 'status', { step: 'researching', message: 'Generating research...' });
    console.log('\n📚 Step 2: Generating research...');
    
    const research: ResearchNotes = await llmService.generateResearch(
      validation.cleanedTopic, 
      tone, 
      duration
    );
    
    sendEvent(res, 'researched', { 
      step: 'researched',
      keyPointsCount: research.keyPoints.length,
      factsCount: research.facts.length,
      message: `Research complete: ${research.keyPoints.length} key points`
    });
    console.log(`   ✓ Research complete: ${research.keyPoints.length} key points`);

    // Step 3: Generate script
    sendEvent(res, 'status', { step: 'scripting', message: 'Writing script...' });
    console.log('\n✍️ Step 3: Writing script...');
    
    const script: PodcastScript = await llmService.generateScript(research, tone, duration);
    
    sendEvent(res, 'scripted', { 
      step: 'scripted',
      title: script.title,
      speakers: script.speakers.map(s => ({ name: s.name, personality: s.personality })),
      lineCount: script.lines.length,
      message: `Script complete: "${script.title}" with ${script.lines.length} lines`
    });
    console.log(`   ✓ Script complete: "${script.title}" with ${script.lines.length} lines`);

    // Step 4: Generate audio for each line with progress
    sendEvent(res, 'status', { 
      step: 'generating_audio', 
      message: 'Generating audio...',
      totalLines: script.lines.length
    });
    console.log('\n🔊 Step 4: Generating audio...');
    
    const audioSegments = await ttsService.generateAudioForScript(
      script,
      (current, total, speaker, emotion) => {
        sendEvent(res, 'audio_progress', {
          step: 'generating_audio',
          current,
          total,
          speaker,
          emotion,
          message: `Generating line ${current}/${total}: ${speaker} (${emotion})`
        });
      }
    );
    
    sendEvent(res, 'audio_complete', { 
      step: 'audio_complete',
      segmentCount: audioSegments.length,
      message: `Audio generated: ${audioSegments.length} segments`
    });
    console.log(`   ✓ Audio generated: ${audioSegments.length} segments`);

    // Step 5: Merge audio segments
    sendEvent(res, 'status', { step: 'merging', message: 'Merging audio segments...' });
    console.log('\n🎵 Step 5: Merging audio...');
    
    const finalAudio = await audioService.mergeSegments(audioSegments);
    
    console.log(`   ✓ Final audio ready: ${(finalAudio.length / 1024).toFixed(1)} KB`);

    // Step 6: Upload to storage (if enabled)
    let audioUrl: string | null = null;
    if (storageEnabled) {
      sendEvent(res, 'status', { step: 'uploading', message: 'Uploading to cloud storage...' });
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
    sendEvent(res, 'complete', { 
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
    res.end();

  } catch (error) {
    console.error('Generation error:', error);
    sendEvent(res, 'error', { 
      error: 'Failed to generate podcast', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.end();
  }
});

// POST /api/generate - Generate a podcast episode (non-streaming, legacy)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { topic, tone, duration }: GenerateRequest = req.body;

    // Validate request
    if (!topic || !tone || !duration) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['topic', 'tone', 'duration'] 
      });
    }

    if (!['casual', 'educational', 'humorous'].includes(tone)) {
      return res.status(400).json({ error: 'Invalid tone. Must be: casual, educational, or humorous' });
    }

    if (!['short', 'medium'].includes(duration)) {
      return res.status(400).json({ error: 'Invalid duration. Must be: short or medium' });
    }

    // Initialize services (will throw if API keys missing)
    const { llmService, ttsService, audioService } = getServices();

    const modelInfo = llmService.getModelInfo();
    console.log(`\n🎙️ Starting podcast generation...`);
    console.log(`   Topic: ${topic}`);
    console.log(`   Tone: ${tone}`);
    console.log(`   Duration: ${duration}`);
    console.log(`   Model: ${modelInfo.model} (${modelInfo.provider})`);

    // Step 1: Validate topic
    console.log('\n📋 Step 1: Validating topic...');
    const validation = await llmService.validateTopic(topic);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid topic', 
        reason: validation.reason 
      });
    }
    console.log(`   ✓ Topic validated: "${validation.cleanedTopic}"`);

    // Step 2: Generate research
    console.log('\n📚 Step 2: Generating research...');
    const research = await llmService.generateResearch(
      validation.cleanedTopic, 
      tone, 
      duration
    );
    console.log(`   ✓ Research complete: ${research.keyPoints.length} key points`);

    // Step 3: Generate script
    console.log('\n✍️ Step 3: Writing script...');
    const script = await llmService.generateScript(research, tone, duration);
    console.log(`   ✓ Script complete: "${script.title}" with ${script.lines.length} lines`);

    // Step 4: Generate audio for each line
    console.log('\n🔊 Step 4: Generating audio...');
    const audioSegments = await ttsService.generateAudioForScript(script);
    console.log(`   ✓ Audio generated: ${audioSegments.length} segments`);

    // Step 5: Merge audio segments
    console.log('\n🎵 Step 5: Merging audio...');
    const finalAudio = await audioService.mergeSegments(audioSegments);
    console.log(`   ✓ Final audio ready: ${(finalAudio.length / 1024).toFixed(1)} KB`);

    // Send audio response
    console.log('\n✅ Podcast generation complete! Streaming audio...\n');
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': finalAudio.length,
      'Content-Disposition': `attachment; filename="kotomo-${Date.now()}.mp3"`,
    });
    
    res.send(finalAudio);

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate podcast', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/voices - List available voices (for future use)
router.get('/voices', async (req: Request, res: Response) => {
  try {
    const { ttsService } = getServices();
    const voices = ttsService.getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// GET /api/podcasts - List stored podcasts
router.get('/podcasts', async (req: Request, res: Response) => {
  try {
    const { storageService } = getServices();
    
    if (!storageService.isEnabled()) {
      return res.json({ 
        podcasts: [], 
        message: 'Storage not configured. Set BLOB_READ_WRITE_TOKEN to enable.' 
      });
    }
    
    const podcasts = await storageService.listPodcasts();
    res.json({ podcasts });
  } catch (error) {
    console.error('Failed to list podcasts:', error);
    res.status(500).json({ error: 'Failed to list podcasts' });
  }
});

export default router;
