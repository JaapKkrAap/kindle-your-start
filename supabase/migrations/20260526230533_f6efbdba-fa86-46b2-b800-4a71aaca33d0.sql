
-- 1. Extend relationship_states with mood + intimacy
ALTER TABLE public.relationship_states
  ADD COLUMN IF NOT EXISTS current_mood text NOT NULL DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS mood_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS intimacy_level integer NOT NULL DEFAULT 0;

-- Unique upsert target (persona_id can be NULL → use two partial indexes)
CREATE UNIQUE INDEX IF NOT EXISTS relationship_states_unique_with_persona
  ON public.relationship_states (character_id, persona_id, user_id)
  WHERE persona_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS relationship_states_unique_no_persona
  ON public.relationship_states (character_id, user_id)
  WHERE persona_id IS NULL;

-- 2. Extend memories categories with intimate types
ALTER TABLE public.memories DROP CONSTRAINT IF EXISTS memories_category_check;
ALTER TABLE public.memories ADD CONSTRAINT memories_category_check
  CHECK (category = ANY (ARRAY[
    'event','relationship','location','item','persona_impression','emotional_shift',
    'kink','promise','secret','favorite'
  ]));
