-- Add user_id column to ai_settings table
ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id NOT NULL after setting default for existing rows
UPDATE public.ai_settings SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Add NOT NULL constraint (if there are rows, they now have user_id)
ALTER TABLE public.ai_settings ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint so each user has only one settings row
ALTER TABLE public.ai_settings ADD CONSTRAINT ai_settings_user_id_unique UNIQUE (user_id);

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can read their own ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Users can insert their own ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Users can update their own ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Users can delete their own ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Authenticated users can read all settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Allow authenticated users to read their own settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update their own settings" ON public.ai_settings;

-- Create proper RLS policies that restrict access to user's own settings
CREATE POLICY "Users can read their own ai_settings" 
ON public.ai_settings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_settings" 
ON public.ai_settings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai_settings" 
ON public.ai_settings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai_settings" 
ON public.ai_settings 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);