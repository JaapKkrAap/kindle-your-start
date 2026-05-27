import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserPersona, UserPersonaFormData } from '@/types';

const TABLE = 'user_personas';

function rowToPersona(row: Record<string, unknown>): UserPersona {
  return {
    id: row.id as string,
    name: row.name as string,
    avatarUrl: (row.avatar_url as string | undefined) ?? undefined,
    backstory: row.backstory as string,
    personalityTraits: (row.personality_traits as string[]) ?? [],
    speechStyle: row.speech_style as string,
    behavioralBoundaries: row.behavioral_boundaries as string,
    defaultTone: row.default_tone as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string) : undefined,
  };
}

export function usePersonas() {
  return useQuery({
    queryKey: ['personas'],
    queryFn: async (): Promise<UserPersona[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => rowToPersona(r as Record<string, unknown>));
    },
  });
}

export function usePersona(id: string | undefined) {
  return useQuery({
    queryKey: ['personas', id],
    queryFn: async (): Promise<UserPersona | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return rowToPersona(data as Record<string, unknown>);
    },
    enabled: !!id,
  });
}

export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UserPersonaFormData): Promise<UserPersona> => {
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
          default_tone: data.defaultTone,
          user_id: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return rowToPersona(row as Record<string, unknown>);
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

      const { error } = await supabase.from(TABLE).update(updateData).eq('id', id);
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
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}
