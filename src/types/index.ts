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
  messageCount?: number;
}

export interface Memory {
  id: string;
  characterId: string;
  personaId?: string;
  category: MemoryCategory;
  content: string;
  importance: number;
  isPinned: boolean;
  createdAt: Date;
  sourceMessageId?: string;
}

export type MemoryCategory =
  | 'fact'
  | 'preference'
  | 'relationship'
  | 'event'
  | 'emotion'
  | 'goal'
  | 'location'
  | 'item'
  | 'persona_impression'
  | 'emotional_shift';

export interface NarrativeDirective {
  id: string;
  characterId: string;
  type: 'goal' | 'reveal' | 'escalate' | 'resolve';
  description: string;
  triggerCondition?: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
}

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

export type AIProvider = 'lmstudio' | 'openrouter' | 'openai';

export interface AISettings {
  provider: AIProvider;
  lmstudioEndpoint: string;
  lmstudioModel: string;
  openrouterModel: string;
  openaiModel: string;
  temperature: number;
  maxTokens: number;
  systemPromptOverride?: string;
}


export interface UISettings {
  showChatBackgrounds: boolean;
}

export interface AppSettings {
  ai: AISettings;
  ui: UISettings;
}


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

export interface RelationshipState {
  id: string;
  characterId: string;
  personaId?: string;
  userId: string;
  trust: number;
  affection: number;
  tension: number;
  respect: number;
  createdAt: Date;
  updatedAt: Date;
}


export interface WorldState {
  location: 'indoor' | 'outdoor' | 'urban' | 'nature' | 'fantasy';
  timeOfDay: 'day' | 'night';
  mood: 'neutral' | 'romantic' | 'tense' | 'mysterious' | 'peaceful';
}

