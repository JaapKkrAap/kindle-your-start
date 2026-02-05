import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
        .order('is_pinned', { ascending: false })
        .order('importance', { ascending: false })
        .limit(100);

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
        isPinned: memory.is_pinned,
        createdAt: new Date(memory.created_at),
        sourceMessageId: memory.source_message_id ?? undefined,
      }));
    },
    enabled: !!characterId,
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

export function useTogglePinMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from('memories')
        .update({ is_pinned: isPinned })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
