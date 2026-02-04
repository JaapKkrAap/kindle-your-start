import { useState, useCallback } from 'react';

export interface NarrativeDirective {
  id: string;
  type: 'goal' | 'reveal' | 'escalate' | 'resolve';
  description: string;
  priority: number;
}

export const DIRECTIVE_TEMPLATES: Record<string, Omit<NarrativeDirective, 'id'>> = {
  buildTension: {
    type: 'escalate',
    description: 'Gradually increase tension in the scene. Hint at something being wrong or a conflict brewing.',
    priority: 7,
  },
  revealSecret: {
    type: 'reveal',
    description: 'Work toward revealing a hidden aspect of your character or a secret you\'ve been keeping.',
    priority: 8,
  },
  pursueGoal: {
    type: 'goal',
    description: 'Actively pursue your character\'s primary motivation. Make choices that advance this goal.',
    priority: 6,
  },
  createConflict: {
    type: 'escalate',
    description: 'Introduce a point of disagreement or conflict with the user\'s character. Challenge them.',
    priority: 7,
  },
  deepenRelationship: {
    type: 'goal',
    description: 'Take steps to deepen the emotional connection with the user\'s character.',
    priority: 6,
  },
  resolveArc: {
    type: 'resolve',
    description: 'Work toward resolving the current conflict or storyline. Bring closure to open threads.',
    priority: 8,
  },
};

export function useNarrativeDirectives(characterId?: string) {
  const [directives, setDirectives] = useState<NarrativeDirective[]>([]);

  const addDirective = useCallback((directive: Omit<NarrativeDirective, 'id'>) => {
    const newDirective: NarrativeDirective = {
      ...directive,
      id: crypto.randomUUID(),
    };
    setDirectives(prev => [...prev, newDirective]);
    return newDirective;
  }, []);

  const addFromTemplate = useCallback((templateKey: keyof typeof DIRECTIVE_TEMPLATES) => {
    const template = DIRECTIVE_TEMPLATES[templateKey];
    if (template) {
      return addDirective(template);
    }
    return null;
  }, [addDirective]);

  const removeDirective = useCallback((id: string) => {
    setDirectives(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearDirectives = useCallback(() => {
    setDirectives([]);
  }, []);

  const updatePriority = useCallback((id: string, priority: number) => {
    setDirectives(prev => prev.map(d => 
      d.id === id ? { ...d, priority: Math.min(10, Math.max(1, priority)) } : d
    ));
  }, []);

  const getDirectivesForApi = useCallback(() => {
    return directives.map(d => ({
      type: d.type,
      description: d.description,
      priority: d.priority,
    }));
  }, [directives]);

  return {
    directives,
    addDirective,
    addFromTemplate,
    removeDirective,
    clearDirectives,
    updatePriority,
    getDirectivesForApi,
    templates: DIRECTIVE_TEMPLATES,
  };
}
