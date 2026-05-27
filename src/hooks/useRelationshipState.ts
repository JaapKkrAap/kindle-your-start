import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RelationshipState } from '@/types';

const TABLE = 'relationship_states';

function rowToRelationshipState(row: Record<string, unknown>): RelationshipState {
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    personaId: (row.persona_id as string | undefined) ?? undefined,
    userId: row.user_id as string,
    trust: (row.trust as number) ?? 50,
    affection: (row.affection as number) ?? 50,
    tension: (row.tension as number) ?? 0,
    respect: (row.respect as number) ?? 50,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export function useRelationshipState(characterId?: string, personaId?: string) {
  return useQuery({
    queryKey: ['relationship_state', characterId, personaId],
    queryFn: async (): Promise<RelationshipState | null> => {
      if (!characterId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let query = supabase
        .from(TABLE)
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', user.id);

      if (personaId) {
        query = query.eq('persona_id', personaId);
      } else {
        query = query.is('persona_id', null);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return rowToRelationshipState(data as Record<string, unknown>);
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
      const { characterId, personaId, id: _id, createdAt: _ca, updatedAt: _ua, userId: _uid, ...fields } = updates;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        character_id: characterId,
        persona_id: personaId ?? null,
        user_id: user.id,
        trust: fields.trust ?? 50,
        affection: fields.affection ?? 50,
        tension: fields.tension ?? 0,
        respect: fields.respect ?? 50,
      };

      // Try update first, then insert if not found (manual upsert to avoid ON CONFLICT issues)
      let query = supabase
        .from(TABLE)
        .select('id')
        .eq('character_id', characterId)
        .eq('user_id', user.id);
      if (personaId) {
        query = query.eq('persona_id', personaId);
      } else {
        query = query.is('persona_id', null);
      }
      const { data: existing } = await query.maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from(TABLE)
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(TABLE).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['relationship_state', variables.characterId, variables.personaId],
      });
    },
  });
}
