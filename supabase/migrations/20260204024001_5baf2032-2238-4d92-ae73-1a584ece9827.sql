-- Characters table
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  backstory TEXT NOT NULL DEFAULT '',
  personality_traits TEXT[] NOT NULL DEFAULT '{}',
  speech_style TEXT NOT NULL DEFAULT '',
  behavioral_boundaries TEXT NOT NULL DEFAULT '',
  first_message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_played_at TIMESTAMP WITH TIME ZONE
);

-- User Personas table
CREATE TABLE public.user_personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  backstory TEXT NOT NULL DEFAULT '',
  personality_traits TEXT[] NOT NULL DEFAULT '{}',
  speech_style TEXT NOT NULL DEFAULT '',
  behavioral_boundaries TEXT NOT NULL DEFAULT '',
  default_tone TEXT NOT NULL DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Chat Sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.user_personas(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New Session',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat Messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.user_personas(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'character', 'system')),
  content TEXT NOT NULL,
  is_canon BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Memories table
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.user_personas(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('event', 'relationship', 'location', 'item', 'persona_impression', 'emotional_shift')),
  content TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  source_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Canon Events table
CREATE TABLE public.canon_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.user_personas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  involved_characters TEXT[] NOT NULL DEFAULT '{}',
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_message_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Settings table (single row for app-wide settings)
CREATE TABLE public.ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'lmstudio' CHECK (provider IN ('lmstudio', 'openrouter')),
  lmstudio_endpoint TEXT NOT NULL DEFAULT 'http://localhost:1234/v1',
  lmstudio_model TEXT NOT NULL DEFAULT 'default',
  openrouter_model TEXT NOT NULL DEFAULT 'anthropic/claude-3.5-sonnet',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.8 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER NOT NULL DEFAULT 2048 CHECK (max_tokens >= 1 AND max_tokens <= 16384),
  system_prompt_override TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (single user app - allow all for now)
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canon_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for single-user access (allow all operations)
CREATE POLICY "Allow all operations on characters" ON public.characters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_personas" ON public.user_personas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chat_sessions" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on memories" ON public.memories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on canon_events" ON public.canon_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ai_settings" ON public.ai_settings FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_personas_updated_at
  BEFORE UPDATE ON public.user_personas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_character_id ON public.chat_messages(character_id);
CREATE INDEX idx_chat_sessions_character_id ON public.chat_sessions(character_id);
CREATE INDEX idx_memories_character_id ON public.memories(character_id);
CREATE INDEX idx_canon_events_character_id ON public.canon_events(character_id);

-- Insert default AI settings row
INSERT INTO public.ai_settings (id) VALUES (gen_random_uuid());