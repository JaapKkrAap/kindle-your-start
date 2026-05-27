import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, BookOpen, UserCircle, Brain, Scroll } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/layout/PageShell';

interface Stats {
  characters: number;
  chatSessions: number;
  messages: number;
  memories: number;
  canonEvents: number;
}

interface RecentCharacter {
  id: string;
  name: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    characters: 0,
    chatSessions: 0,
    messages: 0,
    memories: 0,
    canonEvents: 0,
  });
  const [recentCharacters, setRecentCharacters] = useState<RecentCharacter[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: characters },
        { count: chatSessions },
        { count: messages },
        { count: memories },
        { count: canonEvents },
        { data: recent },
      ] = await Promise.all([
        supabase.from('characters').select('*', { count: 'exact', head: true }),
        supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
        supabase.from('memories').select('*', { count: 'exact', head: true }),
        supabase.from('canon_events').select('*', { count: 'exact', head: true }),
        supabase
          .from('characters')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setStats({
        characters: characters ?? 0,
        chatSessions: chatSessions ?? 0,
        messages: messages ?? 0,
        memories: memories ?? 0,
        canonEvents: canonEvents ?? 0,
      });
      setRecentCharacters(recent ?? []);
    }

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Characters', value: stats.characters, icon: UserCircle, color: 'text-purple-400' },
    { label: 'Chat Sessions', value: stats.chatSessions, icon: MessageSquare, color: 'text-green-400' },
    { label: 'Messages', value: stats.messages, icon: BookOpen, color: 'text-orange-400' },
    { label: 'Memories', value: stats.memories, icon: Brain, color: 'text-pink-400' },
    { label: 'Canon Events', value: stats.canonEvents, icon: Scroll, color: 'text-blue-400' },
  ];

  return (
    <PageShell
      title="Local Stats"
      description="Overview of everything stored in your account."
    >
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label} className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recentCharacters.length > 0 && (
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>Recent Characters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/40">
              {recentCharacters.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
