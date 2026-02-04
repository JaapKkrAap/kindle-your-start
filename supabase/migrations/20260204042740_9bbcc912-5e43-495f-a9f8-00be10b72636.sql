-- ================================================
-- SECURITY FIX: Multi-user authentication and data isolation
-- ================================================

-- 1. Remove API key column from ai_settings (move to secrets only)
ALTER TABLE public.ai_settings DROP COLUMN IF EXISTS openrouter_api_key;

-- 2. Add user_id column to all user-scoped tables
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_personas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.canon_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop all existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on characters" ON public.characters;
DROP POLICY IF EXISTS "Allow all operations on user_personas" ON public.user_personas;
DROP POLICY IF EXISTS "Allow all operations on chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Allow all operations on chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all operations on memories" ON public.memories;
DROP POLICY IF EXISTS "Allow all operations on canon_events" ON public.canon_events;
DROP POLICY IF EXISTS "Allow all operations on ai_settings" ON public.ai_settings;

-- 6. Create user-scoped RLS policies for characters
CREATE POLICY "Users can read their own characters" 
ON public.characters FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own characters" 
ON public.characters FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters" 
ON public.characters FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters" 
ON public.characters FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 7. Create user-scoped RLS policies for user_personas
CREATE POLICY "Users can read their own personas" 
ON public.user_personas FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personas" 
ON public.user_personas FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personas" 
ON public.user_personas FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas" 
ON public.user_personas FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 8. Create user-scoped RLS policies for chat_sessions
CREATE POLICY "Users can read their own chat sessions" 
ON public.chat_sessions FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions" 
ON public.chat_sessions FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" 
ON public.chat_sessions FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 9. Create user-scoped RLS policies for chat_messages
CREATE POLICY "Users can read their own chat messages" 
ON public.chat_messages FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" 
ON public.chat_messages FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" 
ON public.chat_messages FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
ON public.chat_messages FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 10. Create user-scoped RLS policies for memories
CREATE POLICY "Users can read their own memories" 
ON public.memories FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories" 
ON public.memories FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" 
ON public.memories FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.memories FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 11. Create user-scoped RLS policies for canon_events
CREATE POLICY "Users can read their own canon events" 
ON public.canon_events FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own canon events" 
ON public.canon_events FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own canon events" 
ON public.canon_events FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own canon events" 
ON public.canon_events FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 12. Create RLS policies for profiles
CREATE POLICY "Users can read their own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 13. AI Settings: Allow authenticated users to read/update global settings
-- (Settings are shared but only authenticated users can access)
CREATE POLICY "Authenticated users can read ai settings" 
ON public.ai_settings FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update ai settings" 
ON public.ai_settings FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- 14. Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Update storage policies for avatars to require authentication
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete avatars" ON storage.objects;

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');