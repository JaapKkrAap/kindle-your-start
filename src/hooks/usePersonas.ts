import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserPersona, UserPersonaFormData } from '@/types';

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export function usePersonas() {
  return useQuery({
    queryKey: ['personas'],
    queryFn: async (): Promise<UserPersona[]> => {
      const { data, error } = await supabase
        .from('user_personas')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(persona => ({
        id: persona.id,
        name: persona.name,
        avatarUrl: persona.avatar_url ?? undefined,
        backstory: persona.backstory,
        personalityTraits: persona.personality_traits,
        speechStyle: persona.speech_style,
        behavioralBoundaries: persona.behavioral_boundaries,
        defaultTone: persona.default_tone,
        createdAt: new Date(persona.created_at),
        updatedAt: new Date(persona.updated_at),
        lastUsedAt: persona.last_used_at ? new Date(persona.last_used_at) : undefined,
      }));
    },
  });
}

export function usePersona(id: string | undefined) {
  return useQuery({
    queryKey: ['personas', id],
    queryFn: async (): Promise<UserPersona | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('user_personas')
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
        defaultTone: data.default_tone,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
      };
    },
    enabled: !!id,
  });
}

export function useCreatePersona() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UserPersonaFormData): Promise<UserPersona> => {
      const userId = await getCurrentUserId();
      
      const { data: created, error } = await supabase
        .from('user_personas')
        .insert({
          user_id: userId,
          name: data.name,
          avatar_url: data.avatarUrl,
          backstory: data.backstory,
          personality_traits: data.personalityTraits,
          speech_style: data.speechStyle,
          behavioral_boundaries: data.behavioralBoundaries,
          default_tone: data.defaultTone,
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
        defaultTone: created.default_tone,
        createdAt: new Date(created.created_at),
        updatedAt: new Date(created.updated_at),
        lastUsedAt: undefined,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}

export function useUpdatePersona() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserPersonaFormData> }): Promise<void> => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.backstory !== undefined) updateData.backstory = data.backstory;
      if (data.personalityTraits !== undefined) updateData.personality_traits = data.personalityTraits;
      if (data.speechStyle !== undefined) updateData.speech_style = data.speechStyle;
      if (data.behavioralBoundaries !== undefined) updateData.behavioral_boundaries = data.behavioralBoundaries;
      if (data.defaultTone !== undefined) updateData.default_tone = data.defaultTone;
      
      const { error } = await supabase
        .from('user_personas')
        .update(updateData as never)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      queryClient.invalidateQueries({ queryKey: ['personas', id] });
    },
  });
}

export function useDeletePersona() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('user_personas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}
