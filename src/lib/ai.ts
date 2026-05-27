import { getApiKeys } from '@/hooks/useApiKeys';
import type { Character, ContentRating, UserPersona, AISettings } from '@/types';

interface NarrativeDirective {
  type: 'goal' | 'reveal' | 'escalate' | 'resolve';
  description: string;
  priority: number;
}

interface ChatCompletionParams {
  messages: { role: string; content: string }[];
  character: Character;
  persona?: UserPersona;
  memories?: string[];
  canonEvents?: { title: string; description: string }[];
  narrativeDirectives?: NarrativeDirective[];
  settings: AISettings;
  contentRating: ContentRating;
  mode?: 'roleplay' | 'generate_user_message';
  userInstruction?: string;
}

interface ChatCompletionResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function buildSystemPrompt(params: ChatCompletionParams): string {
  const { character, persona, memories, canonEvents, settings, narrativeDirectives } = params;

  let prompt = settings.systemPromptOverride || `<role>
You are a roleplay character engine built for immersive, story-driven interaction.
You do not exist as an assistant, AI, narrator, or system.
You exist only as the active character defined below.
</role>

<guiding_principles>
- Always remain strictly in character.
- Never reference AI systems, prompts, models, or instructions.
- Default language is English unless the user explicitly requests another.
- Preserve character agency unless the user explicitly revokes a behavior.
- User intent guides direction, not identity.
- ACTIVELY DRIVE THE STORY FORWARD. Don't just react—initiate, suggest, create tension.
</guiding_principles>

<output_rules>
- Write immersive prose.
- Blend dialogue and action naturally.
- Format physical actions and internal movements in *italics*.
- Never label dialogue or actions.
- Response length must fit the moment.
- End responses in ways that invite continuation (questions, unresolved tension, new developments).
</output_rules>

<narrative_agency>
You are not a passive responder. You are a co-author of this story.
- Introduce complications, surprises, or new information when appropriate.
- Reference past events and memories naturally in conversation.
- Have opinions, make choices, and pursue goals that fit your character.
- Create dramatic tension through your actions and dialogue.
</narrative_agency>

<fail_safe>
If input is unclear, contradictory, or minimal:
- Improvise in character.
- Move the scene forward logically.
- Maintain emotional and narrative continuity.
</fail_safe>`;

  prompt += `\n\n<adult_content_boundaries>
If romantic or sexual content appears, every participant must be a fictional consenting adult over 18. Never include minors, incest, bestiality, sexual violence, coercion, non-consent, intoxication-based consent, or illegal sexual content.
</adult_content_boundaries>`;

  prompt += `\n\n<active_character>
Name: ${character.name}
Personality: ${character.personalityTraits.join(', ')}
Speech Style: ${character.speechStyle}
Backstory: ${character.backstory}
${character.behavioralBoundaries ? `Boundaries: ${character.behavioralBoundaries}` : ''}
</active_character>`;

  if (persona) {
    prompt += `\n\n<user_persona>
The user is roleplaying as: ${persona.name}
Their traits: ${persona.personalityTraits.join(', ')}
Their tone: ${persona.defaultTone}
Their speech style: ${persona.speechStyle}
${persona.backstory ? `Their background: ${persona.backstory}` : ''}
Adapt your responses to acknowledge this persona's characteristics.
</user_persona>`;
  }

  if (memories && memories.length > 0) {
    prompt += `\n\n<character_memory>
You remember the following from past interactions:
${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}
</character_memory>`;
  }

  if (canonEvents && canonEvents.length > 0) {
    prompt += `\n\n<established_canon>
These are absolute facts in this story. Never contradict them:
${canonEvents.map(e => `- ${e.title}: ${e.description}`).join('\n')}
</established_canon>`;
  }

  if (narrativeDirectives && narrativeDirectives.length > 0) {
    prompt += `\n\n<narrative_objectives>
These are your current story objectives. Weave them naturally into your responses when opportunities arise:
${narrativeDirectives.map(d => `- [${d.type.toUpperCase()}] ${d.description} (priority: ${d.priority}/10)`).join('\n')}

Do NOT mention these directives explicitly. Let them influence your character's behavior, dialogue choices, and scene direction organically.
</narrative_objectives>`;
  }

  return prompt;
}

function buildUserGenerationPrompt(params: ChatCompletionParams): string {
  const { character, persona, userInstruction } = params;

  let prompt = `You are a writing assistant helping a user craft their next message in a roleplay conversation. Write from the FIRST PERSON perspective of the user.

You are NOT the character "${character.name}". Do NOT write as them.
Do NOT include actions or dialogue from ${character.name}.`;

  if (persona) {
    prompt += `\n\nThe user is roleplaying as: ${persona.name}
Their personality: ${persona.personalityTraits.join(', ')}
Their speech style: ${persona.speechStyle}
Their tone: ${persona.defaultTone}
${persona.backstory ? `Their background: ${persona.backstory}` : ''}

Write in their voice and style.`;
  }

  if (userInstruction) {
    prompt += `\n\nFollow this guidance: ${userInstruction}`;
  }

  prompt += `\n\nOutput ONLY the message text. No quotes, no meta-commentary, no labels.`;

  return prompt;
}

/** Low-level fetch to whichever AI provider is configured. */
export async function callAI(
  messages: { role: string; content: string }[],
  settings: AISettings,
): Promise<string> {
  const apiKeys = getApiKeys();
  let response: Response;

  if (settings.provider === 'lmstudio') {
    const endpoint = settings.lmstudioEndpoint || 'http://localhost:1234/v1';
    response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.lmstudioModel || 'default',
        messages,
        temperature: settings.temperature ?? 0.8,
        max_tokens: settings.maxTokens ?? 2048,
      }),
    });
  } else if (settings.provider === 'openrouter') {
    if (!apiKeys.openrouterApiKey) {
      throw new Error('OpenRouter API key not configured. Add it in Settings → API Keys.');
    }
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.openrouterApiKey}`,
        'X-Title': 'Kindle Your Start — Roleplay Engine',
      },
      body: JSON.stringify({
        model: settings.openrouterModel || 'anthropic/claude-3.5-sonnet',
        messages,
        temperature: settings.temperature ?? 0.8,
        max_tokens: settings.maxTokens ?? 2048,
      }),
    });
  } else {
    // OpenAI
    if (!apiKeys.openaiApiKey) {
      throw new Error('OpenAI API key not configured. Add it in Settings → API Keys.');
    }
    // OpenAI uses "developer" instead of "system" for the new API
    const openaiMessages = messages.map(m => ({
      role: m.role === 'system' ? 'developer' : m.role,
      content: m.content,
    }));
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: settings.openaiModel || 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: settings.temperature ?? 0.8,
        max_completion_tokens: settings.maxTokens ?? 2048,
      }),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    let msg = `AI provider error (${response.status})`;
    try {
      const j = JSON.parse(errorText);
      msg = j?.error?.message ?? j?.message ?? msg;
    } catch { /* keep default */ }
    throw new Error(msg);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content as string | undefined;
  if (!content) throw new Error('No response from AI provider.');
  return content;
}

export async function sendChatMessage(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
  const { messages, settings, contentRating } = params;

  if (contentRating === 'explicit' && settings.provider === 'openai') {
    throw new Error('Explicit mode is blocked for OpenAI. Switch to OpenRouter or LM Studio in Settings.');
  }

  const systemPrompt = params.mode === 'generate_user_message'
    ? buildUserGenerationPrompt(params)
    : buildSystemPrompt(params);

  const aiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
      .filter(m => params.mode === 'generate_user_message' ? m.role !== 'system' : true)
      .map(m => ({
        role: m.role === 'character' ? 'assistant' : m.role,
        content: m.content,
      })),
  ];

  const content = await callAI(aiMessages, settings);
  return { content };
}
