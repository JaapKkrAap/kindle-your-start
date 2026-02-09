import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AISettings } from '@/types';

export function useAISettings() {
  return useQuery({
    queryKey: ['ai-settings'],
    queryFn: async (): Promise<AISettings> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');


      // Try to get user's existing settings
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist for this user, create default settings
      if (!data) {
        const defaultSettings = {
          user_id: user.id,
          provider: 'openrouter',
          lmstudio_endpoint: 'http://localhost:1234/v1',
          lmstudio_model: 'default',
          openrouter_model: 'anthropic/claude-3.5-sonnet',
          temperature: 0.8,
          max_tokens: 2048,
          system_prompt_override: null,
        };

        const { data: newData, error: insertError } = await supabase
          .from('ai_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          provider: newData.provider as 'lmstudio' | 'openrouter',
          lmstudioEndpoint: newData.lmstudio_endpoint,
          lmstudioModel: newData.lmstudio_model,
          openrouterModel: newData.openrouter_model,
          temperature: Number(newData.temperature),
          maxTokens: newData.max_tokens,
          systemPromptOverride: newData.system_prompt_override ?? undefined,
        };
      }

      return {
        provider: data.provider as 'lmstudio' | 'openrouter',
        lmstudioEndpoint: data.lmstudio_endpoint,
        lmstudioModel: data.lmstudio_model,
        openrouterModel: data.openrouter_model,
        temperature: Number(data.temperature),
        maxTokens: data.max_tokens,
        systemPromptOverride: data.system_prompt_override ?? undefined,
      };
    },
  });
}

export function useUpdateAISettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<AISettings>): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's settings
      const { data: existing, error: fetchError } = await supabase
        .from('ai_settings')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      const updateData: Record<string, unknown> = {};
      if (data.provider !== undefined) updateData.provider = data.provider;
      if (data.lmstudioEndpoint !== undefined) updateData.lmstudio_endpoint = data.lmstudioEndpoint;
      if (data.lmstudioModel !== undefined) updateData.lmstudio_model = data.lmstudioModel;
      if (data.openrouterModel !== undefined) updateData.openrouter_model = data.openrouterModel;
      if (data.temperature !== undefined) updateData.temperature = data.temperature;
      if (data.maxTokens !== undefined) updateData.max_tokens = data.maxTokens;
      if (data.systemPromptOverride !== undefined) updateData.system_prompt_override = data.systemPromptOverride;

      const { error } = await supabase
        .from('ai_settings')
        .update(updateData)
        .eq('id', existing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
    },
  });
}
