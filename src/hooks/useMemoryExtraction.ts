import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Memory, MemoryCategory } from '@/types';

interface ExtractionResult {
  extracted: number;
  memories: Array<{
    category: MemoryCategory;
    content: string;
    importance: number;
  }>;
  error?: string;
  message?: string;
}

export function useMemoryExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastResult, setLastResult] = useState<ExtractionResult | null>(null);

  const extractMemories = useCallback(async (
    sessionId: string,
    characterId: string,
    personaId?: string,
    afterMessageId?: string
  ): Promise<ExtractionResult> => {
    setIsExtracting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-memories', {
        body: {
          sessionId,
          characterId,
          personaId,
          afterMessageId,
        },
      });

      if (error) {
        const result: ExtractionResult = { 
          extracted: 0, 
          memories: [], 
          error: error.message 
        };
        setLastResult(result);
        return result;
      }

      const result = data as ExtractionResult;
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const result: ExtractionResult = { 
        extracted: 0, 
        memories: [], 
        error: errorMessage 
      };
      setLastResult(result);
      return result;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return {
    extractMemories,
    isExtracting,
    lastResult,
  };
}
