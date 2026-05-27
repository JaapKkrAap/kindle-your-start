import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AIProvider, AISettings } from '@/types';

const STORAGE_KEY = 'kindle-your-start:ai-settings:v2';

const DEFAULTS: AISettings = {
  provider: 'openai',
  lmstudioEndpoint: 'http://localhost:1234/v1',
  lmstudioModel: 'default',
  openrouterModel: 'anthropic/claude-3.5-sonnet',
  openaiModel: 'gpt-4o-mini',
  temperature: 0.8,
  maxTokens: 2048,
  systemPromptOverride: undefined,
};

function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) } as AISettings;
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings: AISettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private browsing or quota — silently ignore
  }
}

export function useAISettings() {
  return useQuery({
    queryKey: ['ai-settings'],
    queryFn: (): AISettings => loadSettings(),
    staleTime: Infinity, // localStorage never goes stale between renders
  });
}

export function useUpdateAISettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<AISettings>): Promise<void> => {
      const current = loadSettings();
      const updated = { ...current, ...data };
      saveSettings(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
    },
  });
}
