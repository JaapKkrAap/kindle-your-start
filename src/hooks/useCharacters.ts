import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Character, CharacterFormData } from '@/types';

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: async (): Promise<Character[]> => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(char => ({
        id: char.id,
        name: char.name,
        avatarUrl: char.avatar_url ?? undefined,
        backstory: char.backstory,
        personalityTraits: char.personality_traits,
        speechStyle: char.speech_style,
        behavioralBoundaries: char.behavioral_boundaries,
        firstMessage: char.first_message,
        createdAt: new Date(char.created_at),
        updatedAt: new Date(char.updated_at),
        lastPlayedAt: char.last_played_at ? new Date(char.last_played_at) : undefined,
      }));
    },
  });
}

export function useCharacter(id: string | undefined) {
  return useQuery({
    queryKey: ['characters', id],
    queryFn: async (): Promise<Character | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        avatarUrl: data.avatar_url ?? undefined,
        backstory: data.backstory,
        personalityTraits: data.personality_traits,
        speechStyle: data.speech_style,
        behavioralBoundaries: data.behavioral_boundaries,
        firstMessage: data.first_message,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastPlayedAt: data.last_played_at ? new Date(data.last_played_at) : undefined,
      };
    },
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CharacterFormData): Promise<Character> => {
      const userId = await getCurrentUserId();
      
      const { data: created, error } = await supabase
        .from('characters')
        .insert({
          user_id: userId,
          name: data.name,
          avatar_url: data.avatarUrl,
          backstory: data.backstory,
          personality_traits: data.personalityTraits,
          speech_style: data.speechStyle,
          behavioral_boundaries: data.behavioralBoundaries,
          first_message: data.firstMessage,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: created.id,
        name: created.name,
        avatarUrl: created.avatar_url ?? undefined,
        backstory: created.backstory,
        personalityTraits: created.personality_traits,
        speechStyle: created.speech_style,
        behavioralBoundaries: created.behavioral_boundaries,
        firstMessage: created.first_message,
        createdAt: new Date(created.created_at),
        updatedAt: new Date(created.updated_at),
        lastPlayedAt: undefined,
      };
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
      
      const { error } = await supabase
        .from('characters')
        .update(updateData as never)
        .eq('id', id);
      
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
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}
