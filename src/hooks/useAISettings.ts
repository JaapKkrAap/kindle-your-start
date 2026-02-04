import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AISettings } from '@/types';

export function useAISettings() {
  return useQuery({
    queryKey: ['ai-settings'],
    queryFn: async (): Promise<AISettings> => {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      
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
      // First get the existing settings ID
      const { data: existing, error: fetchError } = await supabase
        .from('ai_settings')
        .select('id')
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
