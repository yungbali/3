import { PodcastScript, AudioSegment } from '../types/podcast';

// Cartesia voice IDs for different speaker types
const VOICE_MAP: Record<string, string> = {
  voice1: '79a125e8-cd45-4c13-8a67-188112f4dd22', // Barbershop Man
  voice2: 'b7d50908-b17c-442d-ad8d-810c63997ed9', // California Girl
};

// Emotion to Cartesia speed/style mapping
const EMOTION_CONFIG: Record<string, { speed: number }> = {
  curious: { speed: 1.0 },
  enthusiastic: { speed: 1.1 },
  thoughtful: { speed: 0.95 },
  surprised: { speed: 1.05 },
  amused: { speed: 1.05 },
  serious: { speed: 0.9 },
  excited: { speed: 1.15 },
  contemplative: { speed: 0.9 },
};

export class TTSService {
  private apiKey: string;
  private baseUrl = 'https://api.cartesia.ai';

  constructor() {
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      throw new Error('CARTESIA_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }

  getAvailableVoices() {
    return [
      { id: 'voice1', name: 'Host 1 (Male)', description: 'Warm, conversational male voice' },
      { id: 'voice2', name: 'Host 2 (Female)', description: 'Friendly, engaging female voice' },
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
    const cartesiaVoiceId = this.getVoiceId(voiceId);
    const emotionConfig = this.getEmotionConfig(emotion);

    const response = await fetch(`${this.baseUrl}/tts/bytes`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Cartesia-Version': '2024-06-10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-2',
        transcript: text,
        voice: {
          mode: 'id',
          id: cartesiaVoiceId,
        },
        output_format: {
          container: 'mp3',
          bit_rate: 128000,
          sample_rate: 44100,
        },
        language: 'en',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cartesia TTS error:', errorText);
      throw new Error(`TTS generation failed: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async generateAudioForScript(script: PodcastScript): Promise<AudioSegment[]> {
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
