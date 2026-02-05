-- Relationship States table
CREATE TABLE public.relationship_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.user_personas(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trust INTEGER NOT NULL DEFAULT 50 CHECK (trust >= 0 AND trust <= 100),
  affection INTEGER NOT NULL DEFAULT 50 CHECK (affection >= 0 AND affection <= 100),
  tension INTEGER NOT NULL DEFAULT 20 CHECK (tension >= 0 AND tension <= 100),
  respect INTEGER NOT NULL DEFAULT 50 CHECK (respect >= 0 AND respect <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(character_id, persona_id, user_id)
);

-- Enable RLS
ALTER TABLE public.relationship_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own relationship states"
  ON public.relationship_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own relationship states"
  ON public.relationship_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationship states"
  ON public.relationship_states FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationship states"
  ON public.relationship_states FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_relationship_states_updated_at
  BEFORE UPDATE ON public.relationship_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_relationship_states_user_id ON public.relationship_states(user_id);
CREATE INDEX idx_relationship_states_character_id ON public.relationship_states(character_id);
CREATE INDEX idx_relationship_states_persona_id ON public.relationship_states(persona_id);
