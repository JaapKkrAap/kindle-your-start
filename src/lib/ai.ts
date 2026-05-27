import { supabase } from '@/integrations/supabase/client';
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

export async function sendChatMessage(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
  const { messages, character, persona, memories, settings, narrativeDirectives } = params;

  if (params.contentRating === 'explicit' && settings.provider === 'openai') {
    throw new Error('Explicit mode is blocked for OpenAI. Switch to OpenRouter or LM Studio in Settings.');
  }

  const { data, error } = await supabase.functions.invoke('chat', {
    body: {
      messages: messages.map(m => ({
        role: m.role === 'character' ? 'assistant' : m.role,
        content: m.content,
      })),
      character: {
        name: character.name,
        backstory: character.backstory,
        personalityTraits: character.personalityTraits,
        speechStyle: character.speechStyle,
        behavioralBoundaries: character.behavioralBoundaries,
      },
      persona: persona ? {
        name: persona.name,
        backstory: persona.backstory,
        personalityTraits: persona.personalityTraits,
        speechStyle: persona.speechStyle,
        defaultTone: persona.defaultTone,
      } : undefined,
      memories,
      canonEvents: params.canonEvents,
      narrativeDirectives,
      mode: params.mode ?? 'roleplay',
      userInstruction: params.userInstruction,
      contentRating: params.contentRating,
      provider: settings.provider,
      lmstudioEndpoint: settings.lmstudioEndpoint || undefined,
      lmstudioModel: settings.lmstudioModel || undefined,
      openrouterModel: settings.openrouterModel || undefined,
      openaiModel: settings.openaiModel || undefined,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      systemPromptOverride: settings.systemPromptOverride,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to get AI response');
  }

  return data as ChatCompletionResponse;
}
