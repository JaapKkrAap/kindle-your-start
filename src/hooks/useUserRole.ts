import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user';

export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }
      setUserId(session.user.id);

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      setRoles((data ?? []).map((r) => r.role as AppRole));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUserId(null);
        setRoles([]);
        setIsLoading(false);
        return;
      }
      setUserId(session.user.id);

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      setRoles((data ?? []).map((r) => r.role as AppRole));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    isAdmin: roles.includes('admin'),
    isModerator: roles.includes('moderator') || roles.includes('admin'),
    isLoading,
    userId,
  };
}
