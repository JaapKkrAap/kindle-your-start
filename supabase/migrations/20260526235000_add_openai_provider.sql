ALTER TABLE public.ai_settings
  ADD COLUMN IF NOT EXISTS openai_model TEXT NOT NULL DEFAULT 'gpt-4o-mini';

ALTER TABLE public.ai_settings
  DROP CONSTRAINT IF EXISTS ai_settings_provider_check;

ALTER TABLE public.ai_settings
  ADD CONSTRAINT ai_settings_provider_check
  CHECK (provider IN ('lmstudio', 'openrouter', 'openai'));

ALTER TABLE public.ai_settings
  ALTER COLUMN provider SET DEFAULT 'openai';
