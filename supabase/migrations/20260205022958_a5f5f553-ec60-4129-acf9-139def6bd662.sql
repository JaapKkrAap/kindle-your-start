-- Add is_pinned column to memories table
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Create relationship_states table
CREATE TABLE IF NOT EXISTS public.relationship_states (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES public.user_personas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    trust integer NOT NULL DEFAULT 50,
    affection integer NOT NULL DEFAULT 50,
    tension integer NOT NULL DEFAULT 0,
    respect integer NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (character_id, persona_id, user_id)
);

-- Enable RLS
ALTER TABLE public.relationship_states ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for relationship_states
CREATE POLICY "Users can view their own relationship states"
ON public.relationship_states
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own relationship states"
ON public.relationship_states
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationship states"
ON public.relationship_states
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationship states"
ON public.relationship_states
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_relationship_states_updated_at
BEFORE UPDATE ON public.relationship_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();