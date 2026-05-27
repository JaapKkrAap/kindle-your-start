import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Character, CharacterFormData } from '@/types';

const TABLE = 'characters';

function rowToCharacter(row: Record<string, unknown>): Character {
  return {
    id: row.id as string,
    name: row.name as string,
    avatarUrl: (row.avatar_url as string | undefined) ?? undefined,
    backstory: row.backstory as string,
    personalityTraits: (row.personality_traits as string[]) ?? [],
    speechStyle: row.speech_style as string,
    behavioralBoundaries: row.behavioral_boundaries as string,
    firstMessage: row.first_message as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    lastPlayedAt: row.last_played_at ? new Date(row.last_played_at as string) : undefined,
  };
}

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: async (): Promise<Character[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => rowToCharacter(r as Record<string, unknown>));
    },
  });
}

export function useCharacter(id: string | undefined) {
  return useQuery({
    queryKey: ['characters', id],
    queryFn: async (): Promise<Character | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return rowToCharacter(data as Record<string, unknown>);
    },
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CharacterFormData): Promise<Character> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: row, error } = await supabase
        .from(TABLE)
        .insert({
          name: data.name,
          avatar_url: data.avatarUrl ?? null,
          backstory: data.backstory,
          personality_traits: data.personalityTraits,
          speech_style: data.speechStyle,
          behavioral_boundaries: data.behavioralBoundaries,
          first_message: data.firstMessage,
          user_id: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return rowToCharacter(row as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CharacterFormData> }): Promise<void> => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.backstory !== undefined) updateData.backstory = data.backstory;
      if (data.personalityTraits !== undefined) updateData.personality_traits = data.personalityTraits;
      if (data.speechStyle !== undefined) updateData.speech_style = data.speechStyle;
      if (data.behavioralBoundaries !== undefined) updateData.behavioral_boundaries = data.behavioralBoundaries;
      if (data.firstMessage !== undefined) updateData.first_message = data.firstMessage;

      const { error } = await supabase.from(TABLE).update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters', id] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}
