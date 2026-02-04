import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Memory, MemoryCategory } from '@/types';

export function useMemories(characterId?: string, personaId?: string) {
  return useQuery({
    queryKey: ['memories', characterId, personaId],
    queryFn: async (): Promise<Memory[]> => {
      if (!characterId) return [];

      let query = supabase
        .from('memories')
        .select('*')
        .eq('character_id', characterId)
        .order('importance', { ascending: false })
        .limit(20);

      // Include both character-wide memories (null persona) and persona-specific ones
      if (personaId) {
        query = query.or(`persona_id.is.null,persona_id.eq.${personaId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(memory => ({
        id: memory.id,
        characterId: memory.character_id,
        personaId: memory.persona_id ?? undefined,
        category: memory.category as MemoryCategory,
        content: memory.content,
        importance: memory.importance,
        createdAt: new Date(memory.created_at),
        sourceMessageId: memory.source_message_id ?? undefined,
      }));
    },
    enabled: !!characterId,
  });
}
