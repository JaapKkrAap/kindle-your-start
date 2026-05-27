import { useState, useCallback } from 'react';
import { getApiKeys } from '@/hooks/useApiKeys';
import { supabase } from '@/integrations/supabase/client';
import type { MemoryCategory } from '@/types';

interface ExtractionResult {
  extracted: number;
  memories: Array<{
    category: MemoryCategory;
    content: string;
    importance: number;
  }>;
  error?: string;
  message?: string;
}

async function callLLMForMemories(
  messages: Array<{ role: string; content: string }>,
  characterId: string
): Promise<ExtractionResult> {
  const apiKeys = getApiKeys();
  const settings = (() => {
    try {
      const raw = localStorage.getItem('kindle-your-start:ai-settings:v2');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  const provider: string = settings.provider ?? 'openai';

  const systemPrompt = `You are a memory extractor for an AI roleplay system.
Given a conversation, extract the most important facts, events, preferences, and relationship developments.
Return a JSON object with a "memories" array. Each memory has:
- category: one of "event", "relationship", "location", "item", "persona_impression", "emotional_shift"
- content: a concise summary (max 150 chars)
- importance: 1-10

Only extract genuinely important information. Return 0-5 memories maximum. Do NOT include trivial chitchat.
Return ONLY valid JSON like: {"memories": [{"category": "...", "content": "...", "importance": 7}]}`;

  const userPrompt = `Extract memories from this conversation:\n\n${messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')}`;

  let apiUrl: string;
  let apiKey: string;
  let model: string;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (provider === 'lmstudio') {
    const endpoint = settings.lmstudioEndpoint ?? 'http://localhost:1234/v1';
    apiUrl = `${endpoint}/chat/completions`;
    apiKey = '';
    model = settings.lmstudioModel ?? 'default';
  } else if (provider === 'openrouter') {
    apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    apiKey = apiKeys.openrouterApiKey;
    model = settings.openrouterModel ?? 'anthropic/claude-3.5-sonnet';
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else {
    // openai
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    apiKey = apiKeys.openaiApiKey;
    model = settings.openaiModel ?? 'gpt-4o-mini';
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (!apiKey && provider !== 'lmstudio') {
    return { extracted: 0, memories: [], error: `No ${provider} API key set. Add one in Settings.` };
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error: ${response.status} ${err}`);
  }

  const json = await response.json();
  const raw = json.choices?.[0]?.message?.content ?? '{}';

  // Parse JSON from response (may be wrapped in markdown fences)
  const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr) as { memories?: Array<{ category: MemoryCategory; content: string; importance: number }> };

  const extracted = parsed.memories ?? [];

  // Get current user for user_id
  const { data: { user } } = await supabase.auth.getUser();

  // Save to Supabase
  if (extracted.length > 0) {
    const { error } = await supabase.from('memories').insert(
      extracted.map((mem) => ({
        character_id: characterId,
        persona_id: null,
        category: mem.category,
        content: mem.content,
        importance: mem.importance,
        is_pinned: false,
        user_id: user?.id ?? null,
      }))
    );
    if (error) console.warn('Failed to save memories to Supabase:', error.message);
  }

  return { extracted: extracted.length, memories: extracted };
}

export function useMemoryExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastResult, setLastResult] = useState<ExtractionResult | null>(null);

  const extractMemories = useCallback(async (
    sessionId: string,
    characterId: string,
    _personaId?: string,
    _afterMessageId?: string
  ): Promise<ExtractionResult> => {
    setIsExtracting(true);

    try {
      // Load messages for this session from Supabase
      const { data: allMessages, error } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) throw error;

      if (!allMessages || allMessages.length === 0) {
        const result: ExtractionResult = { extracted: 0, memories: [], message: 'No messages in session' };
        setLastResult(result);
        return result;
      }

      const messages = allMessages.map((m) => ({ role: m.role, content: m.content }));

      const result = await callLLMForMemories(messages, characterId);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const result: ExtractionResult = { extracted: 0, memories: [], error: errorMessage };
      setLastResult(result);
      return result;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return {
    extractMemories,
    isExtracting,
    lastResult,
  };
}
