import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RelationshipState } from '@/types';

type RelationshipRow = {
    id: string;
    character_id: string;
    persona_id: string | null;
    user_id: string | null;
    trust: number;
    affection: number;
    tension: number;
    respect: number;
    current_mood: string;
    intimacy_level: number;
    mood_updated_at: string;
    created_at: string;
    updated_at: string;
};

function rowToState(data: RelationshipRow): RelationshipState {
    return {
        id: data.id,
        characterId: data.character_id,
        personaId: data.persona_id ?? undefined,
        userId: data.user_id ?? '',
        trust: data.trust,
        affection: data.affection,
        tension: data.tension,
        respect: data.respect,
        currentMood: data.current_mood ?? 'neutral',
        intimacyLevel: data.intimacy_level ?? 0,
        moodUpdatedAt: data.mood_updated_at ? new Date(data.mood_updated_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    };
}

export function useRelationshipState(characterId?: string, personaId?: string) {
    return useQuery({
        queryKey: ['relationship_state', characterId, personaId],
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

            return rowToState(data as RelationshipRow);
        },
        enabled: !!characterId,
    });
}

export function useUpdateRelationshipState() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            updates: Partial<RelationshipState> & { characterId: string; personaId?: string }
        ) => {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('User not authenticated');

            const {
                characterId, personaId,
                id, createdAt, updatedAt, userId,
                currentMood, intimacyLevel, moodUpdatedAt,
                ...metrics
            } = updates;

            const payload: Record<string, unknown> = {
                character_id: characterId,
                persona_id: personaId ?? null,
                user_id: userData.user.id,
                ...metrics,
                updated_at: new Date().toISOString(),
            };
            if (currentMood !== undefined) {
                payload.current_mood = currentMood;
                payload.mood_updated_at = new Date().toISOString();
            }
            if (intimacyLevel !== undefined) payload.intimacy_level = intimacyLevel;

            const onConflict = personaId
                ? 'character_id, persona_id, user_id'
                : 'character_id, user_id';

            const { data, error } = await supabase
                .from('relationship_states')
                .upsert(payload as never, { onConflict })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['relationship_state', variables.characterId, variables.personaId],
            });
        },
    });
}
