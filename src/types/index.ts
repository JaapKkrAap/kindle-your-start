// Core types for the Character Roleplay Application

export interface Character {
  id: string;
  name: string;
  avatarUrl?: string;
  backstory: string;
  personalityTraits: string[];
  speechStyle: string;
  behavioralBoundaries: string;
  firstMessage: string;
  createdAt: Date;
  updatedAt: Date;
  lastPlayedAt?: Date;
}

export interface UserPersona {
  id: string;
  name: string;
  avatarUrl?: string;
  backstory: string;
  personalityTraits: string[];
  speechStyle: string;
  behavioralBoundaries: string;
  defaultTone: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  characterId: string;
  personaId?: string;
  role: 'user' | 'character' | 'system';
  content: string;
  isCanon: boolean;
  createdAt: Date;
  editedAt?: Date;
}

export interface ChatSession {
  id: string;
  characterId: string;
  personaId?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Memory {
  id: string;
  characterId: string;
  personaId?: string;
  category: MemoryCategory;
  content: string;
  importance: number; // 1-10 scale
  createdAt: Date;
  sourceMessageId?: string;
}

export type MemoryCategory = 
  | 'event'
  | 'relationship'
  | 'location'
  | 'item'
  | 'persona_impression'
  | 'emotional_shift';

export interface CanonEvent {
  id: string;
  characterId: string;
  personaId?: string;
  title: string;
  description: string;
  involvedCharacters: string[];
  timestamp: Date;
  createdAt: Date;
  sourceMessageIds: string[];
}

export interface AISettings {
  provider: 'lmstudio' | 'openrouter';
  lmstudioEndpoint: string;
  lmstudioModel: string;
  openrouterModel: string;
  temperature: number;
  maxTokens: number;
  systemPromptOverride?: string;
}

export interface AppSettings {
  ai: AISettings;
}

// Form types for creation/editing
export interface CharacterFormData {
  name: string;
  avatarUrl?: string;
  backstory: string;
  personalityTraits: string[];
  speechStyle: string;
  behavioralBoundaries: string;
  firstMessage: string;
}

export interface UserPersonaFormData {
  name: string;
  avatarUrl?: string;
  backstory: string;
  personalityTraits: string[];
  speechStyle: string;
  behavioralBoundaries: string;
  defaultTone: string;
}

// AI Request/Response types
export interface ChatCompletionRequest {
  messages: { role: string; content: string }[];
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}
