 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 
 export function useUserRole() {
   const { user } = useAuth();
   const userId = user?.id;
 
   const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
     queryKey: ['user-role', 'admin', userId],
     queryFn: async () => {
       if (!userId) return false;
       const { data, error } = await supabase.rpc('has_role', {
         _user_id: userId,
         _role: 'admin'
       });
       if (error) {
         console.error('Error checking admin role:', error);
         return false;
       }
       return data ?? false;
     },
     enabled: !!userId,
     staleTime: 5 * 60 * 1000, // Cache for 5 minutes
   });
 
   const { data: isModerator, isLoading: isModeratorLoading } = useQuery({
     queryKey: ['user-role', 'moderator', userId],
     queryFn: async () => {
       if (!userId) return false;
       const { data, error } = await supabase.rpc('has_role', {
         _user_id: userId,
         _role: 'moderator'
       });
       if (error) {
         console.error('Error checking moderator role:', error);
         return false;
       }
       return data ?? false;
     },
     enabled: !!userId,
     staleTime: 5 * 60 * 1000,
   });
 
   return {
     isAdmin: isAdmin ?? false,
     isModerator: isModerator ?? false,
     isLoading: isAdminLoading || isModeratorLoading,
     userId,
   };
 }