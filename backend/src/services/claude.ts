import Anthropic from '@anthropic-ai/sdk';
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

export class ClaudeService {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  async validateTopic(topic: string): Promise<TopicValidation> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `${TOPIC_VALIDATION_PROMPT}\n\nTopic to validate: "${topic}"\n\nRespond with valid JSON only.`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      console.error('Failed to parse validation response:', content.text);
      // Default to valid if parsing fails
      return { isValid: true, cleanedTopic: topic };
    }
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

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nRespond with a JSON object containing: topic, keyPoints (array), facts (array), context (string). JSON only, no markdown.`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      let jsonStr = content.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      console.error('Failed to parse research response:', content.text);
      // Create default research structure
      return {
        topic,
        keyPoints: ['Overview of ' + topic],
        facts: ['This is an interesting topic'],
        context: `A discussion about ${topic}`
      };
    }
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

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nRespond with valid JSON only. The JSON should have: title (string), speakers (array of {name, personality, voiceId}), lines (array of {speaker, text, emotion}).`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      let jsonStr = content.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      const script = JSON.parse(jsonStr.trim()) as PodcastScript;
      
      // Validate and ensure we have the expected structure
      if (!script.title || !script.speakers || !script.lines) {
        throw new Error('Invalid script structure');
      }
      
      return script;
    } catch (error) {
      console.error('Failed to parse script response:', content.text);
      throw new Error('Failed to generate valid podcast script');
    }
  }
}
