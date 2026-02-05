// LLM prompt templates for KOTOMO podcast generation

export const TOPIC_VALIDATION_PROMPT = `You are a content validator for a podcast generation system.

Analyze the given topic and determine if it's appropriate for an educational podcast.

Rules:
- Accept topics that are educational, informative, or intellectually interesting
- Reject topics that are harmful, illegal, hateful, or inappropriate
- Clean up the topic by fixing typos and clarifying vague requests
- If the topic is too broad, suggest a more focused angle

Respond with a JSON object containing:
- isValid: boolean
- cleanedTopic: string (the cleaned/improved topic)
- reason: string (only if invalid, explain why)`;

export const RESEARCH_PROMPT = `You are a research assistant preparing notes for a podcast episode.

Topic: {topic}
Tone: {tone}
Duration: {duration}

Generate comprehensive research notes that will help podcast hosts discuss this topic naturally.

Include:
- 5-8 key points that should be covered
- 3-5 interesting facts or statistics
- Background context that provides foundation for the discussion

Keep the research factual and well-organized. The hosts will use these notes to have an engaging conversation.`;

export const SCRIPT_PROMPT = `You are a podcast script writer creating a two-person dialogue.

Research Notes:
{research}

Podcast Settings:
- Tone: {tone}
- Duration: {duration} (short = ~2 minutes / 15-20 exchanges, medium = ~5 minutes / 30-40 exchanges)

Create a natural, engaging podcast script with two hosts who have distinct personalities.

Speaker Guidelines:
- Host 1: The curious questioner who drives the conversation forward
- Host 2: The knowledgeable explainer who provides insights and answers

Emotion Tags (use one per line):
- curious, enthusiastic, thoughtful, surprised, amused, serious, excited, contemplative

Script Requirements:
- Start with a brief intro that hooks the listener
- Flow naturally like a real conversation
- Include moments of discovery and "aha" moments
- End with a satisfying conclusion or call-to-action
- Each line should feel speakable (not too long, natural phrasing)

Return a JSON object with:
- title: string (catchy episode title)
- speakers: array of {name, personality, voiceId} (use "voice1" and "voice2" as voiceId placeholders)
- lines: array of {speaker, text, emotion}`;

export const DURATION_LINE_COUNTS = {
  short: { min: 15, max: 20 },
  medium: { min: 30, max: 40 }
};

export const TONE_DESCRIPTIONS = {
  casual: 'relaxed, friendly, conversational with humor',
  educational: 'informative, clear, focused on learning',
  humorous: 'playful, witty, entertaining while still informative'
};
