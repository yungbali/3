import { 
  TopicValidation, 
  ResearchNotes, 
  PodcastScript 
} from '../types/podcast';
import { 
  TOPIC_VALIDATION_PROMPT, 
  RESEARCH_PROMPT, 
  SCRIPT_PROMPT,
  DURATION_LINE_COUNTS,
  TONE_DESCRIPTIONS 
} from '../config/prompts';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model: string;
  private appName: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    
    // Default to Claude Sonnet, but allow override via environment
    const configuredModel = process.env.LLM_MODEL || 'anthropic/claude-sonnet-4';
    // Backwards-compat: older, invalid dated IDs → stable OpenRouter IDs
    this.model =
      configuredModel === 'anthropic/claude-sonnet-4-20250514'
        ? 'anthropic/claude-sonnet-4'
        : configuredModel;
    this.appName = process.env.APP_NAME || 'KOTOMO';
    
    console.log(`🤖 LLM Service initialized with model: ${this.model}`);
  }

  private async callOpenRouter(
    messages: OpenRouterMessage[], 
    maxTokens: number
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://kotomo.vercel.app',
        'X-Title': this.appName,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenRouter API error:', response.status, errorBody);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json() as OpenRouterResponse;
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from LLM');
    }

    return data.choices[0].message.content;
  }

  private parseJSON<T>(text: string, fallback?: T): T {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      return JSON.parse(jsonStr.trim()) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', text);
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error('Failed to parse LLM response as JSON');
    }
  }

  async validateTopic(topic: string): Promise<TopicValidation> {
    const content = await this.callOpenRouter(
      [
        {
          role: 'user',
          content: `${TOPIC_VALIDATION_PROMPT}\n\nTopic to validate: "${topic}"\n\nRespond with valid JSON only.`
        }
      ],
      500
    );

    return this.parseJSON<TopicValidation>(content, { 
      isValid: true, 
      cleanedTopic: topic 
    });
  }

  async generateResearch(
    topic: string, 
    tone: string, 
    duration: string
  ): Promise<ResearchNotes> {
    const prompt = RESEARCH_PROMPT
      .replace('{topic}', topic)
      .replace('{tone}', TONE_DESCRIPTIONS[tone as keyof typeof TONE_DESCRIPTIONS])
      .replace('{duration}', duration);

    const content = await this.callOpenRouter(
      [
        {
          role: 'user',
          content: `${prompt}\n\nRespond with a JSON object containing: topic, keyPoints (array), facts (array), context (string). JSON only, no markdown.`
        }
      ],
      2000
    );

    return this.parseJSON<ResearchNotes>(content, {
      topic,
      keyPoints: ['Overview of ' + topic],
      facts: ['This is an interesting topic'],
      context: `A discussion about ${topic}`
    });
  }

  async generateScript(
    research: ResearchNotes, 
    tone: string, 
    duration: string
  ): Promise<PodcastScript> {
    const lineCount = DURATION_LINE_COUNTS[duration as keyof typeof DURATION_LINE_COUNTS];
    
    const prompt = SCRIPT_PROMPT
      .replace('{research}', JSON.stringify(research, null, 2))
      .replace('{tone}', TONE_DESCRIPTIONS[tone as keyof typeof TONE_DESCRIPTIONS])
      .replace('{duration}', `${duration} (target ${lineCount.min}-${lineCount.max} lines)`);

    const content = await this.callOpenRouter(
      [
        {
          role: 'user',
          content: `${prompt}\n\nRespond with valid JSON only. The JSON should have: title (string), speakers (array of {name, personality, voiceId}), lines (array of {speaker, text, emotion}).`
        }
      ],
      4000
    );

    const script = this.parseJSON<PodcastScript>(content);
    
    // Validate and ensure we have the expected structure
    if (!script.title || !script.speakers || !script.lines) {
      throw new Error('Invalid script structure from LLM');
    }
    
    return script;
  }

  // Utility method to get current model info
  getModelInfo(): { model: string; provider: string } {
    const [provider, ...modelParts] = this.model.split('/');
    return {
      model: modelParts.join('/') || this.model,
      provider: provider || 'unknown'
    };
  }
}
