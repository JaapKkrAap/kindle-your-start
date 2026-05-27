import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ChatSession, ChatMessage } from '@/types';

const SESSIONS_TABLE = 'chat_sessions';
const MESSAGES_TABLE = 'chat_messages';

function rowToSession(row: Record<string, unknown>, messageCount?: number): ChatSession {
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    personaId: (row.persona_id as string | undefined) ?? undefined,
    title: row.title as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    messageCount,
  };
}

function rowToMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    characterId: row.character_id as string,
    personaId: (row.persona_id as string | undefined) ?? undefined,
    role: row.role as 'user' | 'character' | 'system',
    content: row.content as string,
    isCanon: (row.is_canon as boolean) ?? false,
    createdAt: new Date(row.created_at as string),
    editedAt: row.edited_at ? new Date(row.edited_at as string) : undefined,
  };
}

export function useChatSessions(characterId?: string) {
  return useQuery({
    queryKey: ['chat-sessions', characterId],
    queryFn: async (): Promise<ChatSession[]> => {
      let query = supabase.from(SESSIONS_TABLE).select('*').order('updated_at', { ascending: false });
      if (characterId) query = query.eq('character_id', characterId);
      const { data, error } = await query;
      if (error) throw error;

      const sessions = data ?? [];
      if (sessions.length === 0) return [];

      const sessionIds = sessions.map((s) => s.id);
      const { data: msgData } = await supabase
        .from(MESSAGES_TABLE)
        .select('session_id')
        .in('session_id', sessionIds);

      const counts: Record<string, number> = {};
      for (const msg of msgData ?? []) {
        counts[msg.session_id] = (counts[msg.session_id] ?? 0) + 1;
      }

      return sessions.map((s) => rowToSession(s as Record<string, unknown>, counts[s.id] ?? 0));
    },
  });
}

export function useChatMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from(MESSAGES_TABLE)
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => rowToMessage(r as Record<string, unknown>));
    },
    enabled: !!sessionId,
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      characterId,
      personaId,
      title,
    }: {
      characterId: string;
      personaId?: string;
      title?: string;
    }): Promise<ChatSession> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from(SESSIONS_TABLE)
        .insert({
          character_id: characterId,
          persona_id: personaId ?? null,
          title: title ?? 'New Session',
          user_id: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return rowToSession(data as Record<string, unknown>, 0);
    },
    onSuccess: (_, { characterId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', characterId] });
    },
  });
}

export function useAddChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      characterId,
      personaId,
      role,
      content,
    }: {
      sessionId: string;
      characterId: string;
      personaId?: string;
      role: 'user' | 'character' | 'system';
      content: string;
    }): Promise<ChatMessage> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from(MESSAGES_TABLE)
        .insert({
          session_id: sessionId,
          character_id: characterId,
          persona_id: personaId ?? null,
          role,
          content,
          is_canon: false,
          user_id: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // Bump session updated_at
      await supabase
        .from(SESSIONS_TABLE)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return rowToMessage(data as Record<string, unknown>);
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      isCanon,
    }: {
      id: string;
      content?: string;
      isCanon?: boolean;
    }): Promise<void> => {
      const updateData: Record<string, unknown> = { edited_at: new Date().toISOString() };
      if (content !== undefined) updateData.content = content;
      if (isCanon !== undefined) updateData.is_canon = isCanon;
      const { error } = await supabase.from(MESSAGES_TABLE).update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
}

export function useToggleCanon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isCanon }: { id: string; isCanon: boolean }): Promise<void> => {
      const { error } = await supabase
        .from(MESSAGES_TABLE)
        .update({ is_canon: isCanon })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      personaId,
    }: {
      id: string;
      title?: string;
      personaId?: string | null;
    }): Promise<void> => {
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (personaId !== undefined) updateData.persona_id = personaId;
      if (Object.keys(updateData).length === 0) return;
      const { error } = await supabase.from(SESSIONS_TABLE).update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await supabase.from(MESSAGES_TABLE).delete().eq('session_id', id);
      const { error } = await supabase.from(SESSIONS_TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });
}

export function useDeleteMessagesAfter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      afterTimestamp,
    }: {
      sessionId: string;
      afterTimestamp: Date;
    }): Promise<void> => {
      const { error } = await supabase
        .from(MESSAGES_TABLE)
        .delete()
        .eq('session_id', sessionId)
        .gte('created_at', afterTimestamp.toISOString());
      if (error) throw error;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    },
  });
}
