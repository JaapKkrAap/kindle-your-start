import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CanonEvent } from '@/types';

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
        .from('canon_events')
        .select('*')
        .order('event_timestamp', { ascending: false });

      if (characterId) {
        query = query.eq('character_id', characterId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        characterId: row.character_id,
        personaId: row.persona_id ?? undefined,
        title: row.title,
        description: row.description,
        involvedCharacters: row.involved_characters,
        timestamp: new Date(row.event_timestamp),
        createdAt: new Date(row.created_at),
        sourceMessageIds: row.source_message_ids,
      }));
    },
  });
}

export function useCreateCanonEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCanonEventInput) => {
      const { data, error } = await supabase
        .from('canon_events')
        .insert({
          character_id: input.characterId,
          persona_id: input.personaId ?? null,
          title: input.title,
          description: input.description,
          source_message_ids: input.sourceMessageIds,
          event_timestamp: input.eventTimestamp.toISOString(),
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
      const { error } = await supabase
        .from('canon_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canon-events'] });
    },
  });
}
