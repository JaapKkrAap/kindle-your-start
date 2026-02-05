-- Add RLS policies for admins to read all data for dashboard stats

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can read all characters
CREATE POLICY "Admins can read all characters"
ON public.characters
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can read all chat sessions
CREATE POLICY "Admins can read all chat_sessions"
ON public.chat_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can read all chat messages
CREATE POLICY "Admins can read all chat_messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));