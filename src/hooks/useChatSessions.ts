import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ChatSession, ChatMessage } from '@/types';

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export function useChatSessions(characterId?: string) {
  return useQuery({
    queryKey: ['chat-sessions', characterId],
    queryFn: async (): Promise<ChatSession[]> => {
      let query = supabase
        .from('chat_sessions')
        .select('*, chat_messages(count)')
        .order('updated_at', { ascending: false });
      
      if (characterId) {
        query = query.eq('character_id', characterId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map(session => ({
        id: session.id,
        characterId: session.character_id,
        personaId: session.persona_id ?? undefined,
        title: session.title,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        messageCount: (session.chat_messages as { count: number }[])?.[0]?.count ?? 0,
      }));
    },
  });
}

export function useChatMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return data.map(msg => ({
        id: msg.id,
        sessionId: msg.session_id,
        characterId: msg.character_id,
        personaId: msg.persona_id ?? undefined,
        role: msg.role as 'user' | 'character' | 'system',
        content: msg.content,
        isCanon: msg.is_canon,
        createdAt: new Date(msg.created_at),
        editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
      }));
    },
    enabled: !!sessionId,
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ characterId, personaId, title }: { characterId: string; personaId?: string; title?: string }): Promise<ChatSession> => {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          character_id: characterId,
          persona_id: personaId,
          title: title ?? 'New Session',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        characterId: data.character_id,
        personaId: data.persona_id ?? undefined,
        title: data.title,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
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
    mutationFn: async ({ sessionId, characterId, personaId, role, content }: {
      sessionId: string;
      characterId: string;
      personaId?: string;
      role: 'user' | 'character' | 'system';
      content: string;
    }): Promise<ChatMessage> => {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          session_id: sessionId,
          character_id: characterId,
          persona_id: personaId,
          role,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update session's updated_at
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      
      return {
        id: data.id,
        sessionId: data.session_id,
        characterId: data.character_id,
        personaId: data.persona_id ?? undefined,
        role: data.role as 'user' | 'character' | 'system',
        content: data.content,
        isCanon: data.is_canon,
        createdAt: new Date(data.created_at),
        editedAt: undefined,
      };
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
    mutationFn: async ({ id, content, isCanon }: { id: string; content?: string; isCanon?: boolean }): Promise<void> => {
      const updateData: Record<string, unknown> = { edited_at: new Date().toISOString() };
      if (content !== undefined) updateData.content = content;
      if (isCanon !== undefined) updateData.is_canon = isCanon;
      
      const { error } = await supabase
        .from('chat_messages')
        .update(updateData)
        .eq('id', id);
      
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
        .from('chat_messages')
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
    mutationFn: async ({ id, title, personaId }: { 
      id: string; 
      title?: string; 
      personaId?: string | null;
    }): Promise<void> => {
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (personaId !== undefined) updateData.persona_id = personaId;
      
      if (Object.keys(updateData).length === 0) return;
      
      const { error } = await supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', id);
      
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
      // Delete all messages first (cascade not automatic)
      const { error: msgError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', id);
      
      if (msgError) throw msgError;
      
      // Then delete the session
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
      
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
    mutationFn: async ({ sessionId, afterTimestamp }: { 
      sessionId: string; 
      afterTimestamp: Date 
    }): Promise<void> => {
      const { error } = await supabase
        .from('chat_messages')
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
