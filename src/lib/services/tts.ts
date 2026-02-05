import { PodcastScript, AudioSegment } from '../types/podcast';

// OpenAI TTS voice options
// All six OpenAI voices mapped by their direct name and aliased for podcast hosts
const VOICE_MAP: Record<string, string> = {
  // Podcast host aliases
  voice1: 'onyx',   // Deep male voice - great for authoritative host
  voice2: 'nova',   // Female voice - warm and engaging
  // Direct OpenAI voice names (pass-through)
  alloy: 'alloy',     // Neutral voice
  echo: 'echo',       // Male voice
  fable: 'fable',     // British accent
  onyx: 'onyx',       // Deep male voice
  nova: 'nova',       // Female voice
  shimmer: 'shimmer', // Soft female voice
};

// Emotion to speed mapping for OpenAI TTS (0.25 to 4.0, default 1.0)
const EMOTION_CONFIG: Record<string, { speed: number }> = {
  curious: { speed: 1.0 },
  enthusiastic: { speed: 1.1 },
  thoughtful: { speed: 0.95 },
  surprised: { speed: 1.05 },
  amused: { speed: 1.05 },
  serious: { speed: 0.9 },
  excited: { speed: 1.15 },
  contemplative: { speed: 0.9 },
  informative: { speed: 1.0 },
  encouraging: { speed: 1.05 },
  amazed: { speed: 1.1 },
  grateful: { speed: 0.95 },
};

export class TTSService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    // Use tts-1 for faster generation, tts-1-hd for higher quality
    this.model = process.env.OPENAI_TTS_MODEL || 'tts-1';
    console.log(`🔊 TTS Service initialized with OpenAI model: ${this.model}`);
  }

  getAvailableVoices() {
    return [
      { id: 'voice1', name: 'Host 1 (Onyx)', description: 'Deep, authoritative male voice' },
      { id: 'voice2', name: 'Host 2 (Nova)', description: 'Warm, engaging female voice' },
      { id: 'alloy', name: 'Alloy', description: 'Neutral voice' },
      { id: 'echo', name: 'Echo', description: 'Male voice' },
      { id: 'fable', name: 'Fable', description: 'British accent' },
      { id: 'shimmer', name: 'Shimmer', description: 'Soft female voice' },
    ];
  }

  private getVoiceId(voiceKey: string): string {
    return VOICE_MAP[voiceKey] || VOICE_MAP.voice1;
  }

  private getEmotionConfig(emotion: string) {
    return EMOTION_CONFIG[emotion] || EMOTION_CONFIG.thoughtful;
  }

  async generateSpeech(
    text: string, 
    voiceId: string, 
    emotion: string
  ): Promise<Buffer> {
    const openaiVoice = this.getVoiceId(voiceId);
    const emotionConfig = this.getEmotionConfig(emotion);

    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        voice: openaiVoice,
        response_format: 'mp3',
        speed: emotionConfig.speed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS error:', errorText);
      throw new Error(`TTS generation failed: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async generateAudioForScript(
    script: PodcastScript,
    onProgress?: (current: number, total: number, speaker: string, emotion: string) => void
  ): Promise<AudioSegment[]> {
    const segments: AudioSegment[] = [];
    
    // Build speaker to voiceId mapping
    const speakerVoiceMap: Record<string, string> = {};
    script.speakers.forEach((speaker, index) => {
      speakerVoiceMap[speaker.name] = speaker.voiceId || `voice${index + 1}`;
    });

    // Generate audio for each line sequentially
    for (let i = 0; i < script.lines.length; i++) {
      const line = script.lines[i];
      const voiceId = speakerVoiceMap[line.speaker] || 'voice1';
      
      console.log(`   Generating line ${i + 1}/${script.lines.length}: ${line.speaker} (${line.emotion})`);
      
      // Report progress before generating
      if (onProgress) {
        onProgress(i + 1, script.lines.length, line.speaker, line.emotion);
      }
      
      try {
        const audioBuffer = await this.generateSpeech(
          line.text,
          voiceId,
          line.emotion
        );
        
        segments.push({
          speakerName: line.speaker,
          audioBuffer,
        });
      } catch (error) {
        console.error(`Failed to generate audio for line ${i + 1}:`, error);
        throw error;
      }
    }

    return segments;
  }
}
