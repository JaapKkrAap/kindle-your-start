import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CanonEvent } from '@/types';

const TABLE = 'canon_events';

function rowToCanonEvent(row: Record<string, unknown>): CanonEvent {
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    personaId: (row.persona_id as string | undefined) ?? undefined,
    title: row.title as string,
    description: row.description as string,
    involvedCharacters: (row.involved_characters as string[]) ?? [],
    timestamp: new Date(row.event_timestamp as string),
    createdAt: new Date(row.created_at as string),
    sourceMessageIds: (row.source_message_ids as string[]) ?? [],
  };
}

interface CreateCanonEventInput {
  characterId: string;
  personaId?: string;
  title: string;
  description: string;
  sourceMessageIds: string[];
  eventTimestamp: Date;
}

export function useCanonEvents(characterId?: string) {
  return useQuery({
    queryKey: ['canon-events', characterId],
    queryFn: async (): Promise<CanonEvent[]> => {
      let query = supabase
        .from(TABLE)
        .select('*')
        .order('event_timestamp', { ascending: false });
      if (characterId) query = query.eq('character_id', characterId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((r) => rowToCanonEvent(r as Record<string, unknown>));
    },
  });
}

export function useCreateCanonEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCanonEventInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          character_id: input.characterId,
          persona_id: input.personaId ?? null,
          title: input.title,
          description: input.description,
          source_message_ids: input.sourceMessageIds,
          event_timestamp: input.eventTimestamp.toISOString(),
          involved_characters: [],
          user_id: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['canon-events'] });
      queryClient.invalidateQueries({ queryKey: ['canon-events', variables.characterId] });
    },
  });
}

export function useDeleteCanonEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canon-events'] });
    },
  });
}
