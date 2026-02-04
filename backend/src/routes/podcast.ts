import { Router, Request, Response } from 'express';
import { GenerateRequest } from '../types/podcast';
import { ClaudeService } from '../services/claude';
import { TTSService } from '../services/tts';
import { AudioService } from '../services/audio';

const router = Router();

// Services initialized lazily on first request
let claudeService: ClaudeService | null = null;
let ttsService: TTSService | null = null;
let audioService: AudioService | null = null;

function getServices() {
  if (!claudeService) claudeService = new ClaudeService();
  if (!ttsService) ttsService = new TTSService();
  if (!audioService) audioService = new AudioService();
  return { claudeService, ttsService, audioService };
}

// POST /api/generate - Generate a podcast episode
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
    const { claudeService, ttsService, audioService } = getServices();

    console.log(`\n🎙️ Starting podcast generation...`);
    console.log(`   Topic: ${topic}`);
    console.log(`   Tone: ${tone}`);
    console.log(`   Duration: ${duration}`);

    // Step 1: Validate topic
    console.log('\n📋 Step 1: Validating topic...');
    const validation = await claudeService.validateTopic(topic);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid topic', 
        reason: validation.reason 
      });
    }
    console.log(`   ✓ Topic validated: "${validation.cleanedTopic}"`);

    // Step 2: Generate research
    console.log('\n📚 Step 2: Generating research...');
    const research = await claudeService.generateResearch(
      validation.cleanedTopic, 
      tone, 
      duration
    );
    console.log(`   ✓ Research complete: ${research.keyPoints.length} key points`);

    // Step 3: Generate script
    console.log('\n✍️ Step 3: Writing script...');
    const script = await claudeService.generateScript(research, tone, duration);
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

export default router;
