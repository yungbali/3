// Request types
export interface GenerateRequest {
  topic: string;
  tone: 'casual' | 'educational' | 'humorous';
  duration: 'short' | 'medium';
}

// Topic validation result
export interface TopicValidation {
  isValid: boolean;
  cleanedTopic: string;
  reason?: string;
}

// Research output
export interface ResearchNotes {
  topic: string;
  keyPoints: string[];
  facts: string[];
  context: string;
}

// Speaker definition
export interface Speaker {
  name: string;
  personality: string;
  voiceId: string;
}

// Script line with emotion
export interface ScriptLine {
  speaker: string;
  text: string;
  emotion: string;
}

// Full podcast script
export interface PodcastScript {
  title: string;
  speakers: Speaker[];
  lines: ScriptLine[];
}

// Audio segment after TTS
export interface AudioSegment {
  speakerName: string;
  audioBuffer: Buffer;
  duration?: number;
}

// Generation status for progress tracking
export type GenerationStatus = 
  | 'validating'
  | 'researching'
  | 'scripting'
  | 'generating_audio'
  | 'merging'
  | 'complete'
  | 'error';

export interface GenerationProgress {
  status: GenerationStatus;
  message: string;
  progress?: number;
}
