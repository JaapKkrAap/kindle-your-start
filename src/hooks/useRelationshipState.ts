import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RelationshipState } from '@/types';

export function useRelationshipState(characterId?: string, personaId?: string) {
    const { data: relationshipState, isLoading, error } = useQuery({
        queryKey: ['relationship', characterId, personaId],
        queryFn: async (): Promise<RelationshipState | null> => {
            if (!characterId) return null;

            let query = supabase
                .from('relationship_states')
                .select('*')
                .eq('character_id', characterId);

            if (personaId) {
                query = query.eq('persona_id', personaId);
            } else {
                query = query.is('persona_id', null);
            }

            const { data, error } = await query.maybeSingle();

            if (error) throw error;
            if (!data) return null;

            return {
                id: data.id,
                characterId: data.character_id,
                personaId: data.persona_id ?? undefined,
                userId: data.user_id ?? '',
                trust: data.trust,
                affection: data.affection,
                tension: data.tension,
                respect: data.respect,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
            };
        },
        enabled: !!characterId,
    });

    return { relationshipState, isLoading, error };
}

export function useAnalyzeRelationship() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ sessionId, characterId, personaId }: { sessionId: string; characterId: string; personaId?: string }) => {
            const { data, error } = await supabase.functions.invoke('analyze-relationship', {
                body: {
                    sessionId,
                    characterId,
                    personaId,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['relationship', variables.characterId, variables.personaId],
            });
        },
    });
}

export function useUpdateRelationshipState() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: Partial<RelationshipState> & { characterId: string; personaId?: string }) => {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('User not authenticated');

            const { characterId, personaId, id, createdAt, updatedAt, userId, ...fields } = updates;

            const { data, error } = await supabase
                .from('relationship_states')
                .upsert({
                    character_id: characterId,
                    persona_id: personaId ?? null,
                    user_id: userData.user.id,
                    ...fields,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'character_id, persona_id, user_id'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['relationship', variables.characterId, variables.personaId],
            });
        },
    });
}
