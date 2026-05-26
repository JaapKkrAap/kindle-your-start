 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { Shield, Users, MessageSquare, BookOpen, UserCircle } from 'lucide-react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Skeleton } from '@/components/ui/skeleton';
 import { PageShell } from '@/components/layout/PageShell';
 import { format } from 'date-fns';
 
 interface ProfileWithRole {
   id: string;
   display_name: string | null;
   created_at: string;
   roles: string[];
 }
 
 export default function AdminDashboardPage() {
   // Fetch statistics
   const { data: stats, isLoading: statsLoading } = useQuery({
     queryKey: ['admin-stats'],
     queryFn: async () => {
       const [profilesRes, charactersRes, sessionsRes, messagesRes] = await Promise.all([
         supabase.from('profiles').select('id', { count: 'exact', head: true }),
         supabase.from('characters').select('id', { count: 'exact', head: true }),
         supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
         supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
       ]);
 
       return {
         users: profilesRes.count ?? 0,
         characters: charactersRes.count ?? 0,
         sessions: sessionsRes.count ?? 0,
         messages: messagesRes.count ?? 0,
       };
     },
   });
 
   // Fetch users with their roles
   const { data: users, isLoading: usersLoading } = useQuery({
     queryKey: ['admin-users'],
     queryFn: async () => {
       const { data: profiles, error: profilesError } = await supabase
         .from('profiles')
         .select('id, display_name, created_at')
         .order('created_at', { ascending: false });
 
       if (profilesError) throw profilesError;
 
       const { data: roles, error: rolesError } = await supabase
         .from('user_roles')
         .select('user_id, role');
 
       if (rolesError) throw rolesError;
 
       // Map roles to users
       const rolesMap = new Map<string, string[]>();
       roles?.forEach((r) => {
         const existing = rolesMap.get(r.user_id) ?? [];
         existing.push(r.role);
         rolesMap.set(r.user_id, existing);
       });
 
       return profiles?.map((p) => ({
         ...p,
         roles: rolesMap.get(p.id) ?? ['user'],
       })) as ProfileWithRole[];
     },
   });
 
   const statCards = [
     { label: 'Total Users', value: stats?.users ?? 0, icon: Users, color: 'text-blue-500' },
     { label: 'Characters', value: stats?.characters ?? 0, icon: UserCircle, color: 'text-purple-500' },
     { label: 'Chat Sessions', value: stats?.sessions ?? 0, icon: MessageSquare, color: 'text-green-500' },
     { label: 'Messages', value: stats?.messages ?? 0, icon: BookOpen, color: 'text-orange-500' },
   ];
 
   const getRoleBadgeVariant = (role: string) => {
     switch (role) {
       case 'admin':
         return 'default';
       case 'moderator':
         return 'secondary';
       default:
         return 'outline';
     }
   };
 
   return (
     <PageShell
       title="Admin Dashboard"
       description="System overview and user management."
       meta={
         <Badge variant="default" className="gap-2">
           <Shield className="h-3.5 w-3.5" />
           Admin Access
         </Badge>
       }
     >
 
       {/* Statistics Cards */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {statCards.map((stat) => (
           <Card key={stat.label} className="premium-card">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">
                 {stat.label}
               </CardTitle>
               <stat.icon className={`h-4 w-4 ${stat.color}`} />
             </CardHeader>
             <CardContent>
               {statsLoading ? (
                 <Skeleton className="h-8 w-20" />
               ) : (
                 <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
               )}
             </CardContent>
           </Card>
         ))}
       </div>
 
       {/* User Management */}
       <Card className="premium-card">
         <CardHeader>
           <CardTitle>User Management</CardTitle>
           <CardDescription>View and manage all registered users</CardDescription>
         </CardHeader>
         <CardContent>
           {usersLoading ? (
             <div className="space-y-2">
               {[...Array(5)].map((_, i) => (
                 <Skeleton key={i} className="h-12 w-full" />
               ))}
             </div>
           ) : (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>User ID</TableHead>
                   <TableHead>Display Name</TableHead>
                   <TableHead>Roles</TableHead>
                   <TableHead>Joined</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {users?.map((user) => (
                   <TableRow key={user.id}>
                     <TableCell className="font-mono text-xs">
                       {user.id.slice(0, 8)}...
                     </TableCell>
                     <TableCell>{user.display_name || 'No name'}</TableCell>
                     <TableCell>
                       <div className="flex gap-1">
                         {user.roles.map((role) => (
                           <Badge key={role} variant={getRoleBadgeVariant(role)}>
                             {role}
                           </Badge>
                         ))}
                       </div>
                     </TableCell>
                     <TableCell>
                       {format(new Date(user.created_at), 'MMM d, yyyy')}
                     </TableCell>
                   </TableRow>
                 ))}
                 {users?.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={4} className="text-center text-muted-foreground">
                       No users found
                     </TableCell>
                   </TableRow>
                 )}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>
     </PageShell>
   );
 }
