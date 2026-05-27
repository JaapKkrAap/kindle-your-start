import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Memory, MemoryCategory } from '@/types';

const TABLE = 'memories';

function rowToMemory(row: Record<string, unknown>): Memory {
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    personaId: (row.persona_id as string | undefined) ?? undefined,
    category: row.category as MemoryCategory,
    content: row.content as string,
    importance: row.importance as number,
    isPinned: (row.is_pinned as boolean) ?? false,
    createdAt: new Date(row.created_at as string),
    sourceMessageId: (row.source_message_id as string | undefined) ?? undefined,
  };
}

export function useMemories(characterId?: string, personaId?: string) {
  return useQuery({
    queryKey: ['memories', characterId, personaId],
    queryFn: async (): Promise<Memory[]> => {
      if (!characterId) return [];

      let query = supabase
        .from(TABLE)
        .select('*')
        .eq('character_id', characterId)
        .order('is_pinned', { ascending: false })
        .order('importance', { ascending: false })
        .limit(100);

      // Include character-wide memories (null persona) and persona-specific ones
      if (personaId) {
        query = query.or(`persona_id.is.null,persona_id.eq.${personaId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((r) => rowToMemory(r as Record<string, unknown>));
    },
    enabled: !!characterId,
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

export function useTogglePinMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { error } = await supabase.from(TABLE).update({ is_pinned: isPinned }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
