import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SeedCharacterCard } from '@/components/characters/SeedCharacterCard';
import { PageShell } from '@/components/layout/PageShell';
import { confirmAdultContent, isAdultContentConfirmed, seedCharacters } from '@/data/seedCharacters';
import { useChatSessions, useDeleteSession } from '@/hooks/useChatSessions';
import { useCharacters } from '@/hooks/useCharacters';
import { useStartSeedCharacter } from '@/hooks/useStartSeedCharacter';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ChatSession } from '@/types';

export default function SessionsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: allSessions, isLoading } = useChatSessions();
  const { data: characters } = useCharacters();
  const { startSeedCharacter, isStartingSeedCharacter } = useStartSeedCharacter();
  const deleteSession = useDeleteSession();
  const [deletingSession, setDeletingSession] = useState<ChatSession | null>(null);
  const [adultConfirmed, setAdultConfirmed] = useState(() => isAdultContentConfirmed());

  const getCharacter = (characterId: string) => {
    return characters?.find(c => c.id === characterId);
  };

  const handleDelete = async () => {
    if (!deletingSession) return;
    try {
      await deleteSession.mutateAsync(deletingSession.id);
      setDeletingSession(null);
      toast({
        title: 'Session deleted',
        description: 'The conversation has been removed.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
        action: (
          <ToastAction altText="Retry" onClick={handleDelete}>
            Retry
          </ToastAction>
        ),
      });
    }
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 35%)`;
  };

  // Group sessions by character
  const sessionsByCharacter = allSessions?.reduce((acc, session) => {
    const key = session.characterId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {} as Record<string, typeof allSessions>);

  if (isLoading) {
    return (
      <PageShell title="Sessions" description="Resume recent conversations and manage your roleplay history.">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="ml-5 border-l-2 border-muted pl-6 space-y-3">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Sessions"
      description="Resume recent conversations and manage your roleplay history."
      meta={allSessions?.length ? <span className="text-xs font-medium uppercase tracking-[0.14em] text-primary">{allSessions.length} session{allSessions.length === 1 ? '' : 's'}</span> : undefined}
    >

      {!allSessions?.length ? (
        <div className="space-y-6">
          <div className="premium-card p-6">
            {adultConfirmed ? (
              <>
                <Badge className="mb-4 border-primary/25 bg-primary/10 text-primary hover:bg-primary/10" variant="outline">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Start a story tonight
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight">Your next session starts with one tap.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Pick a starter character below. The app will copy them into your private library and open the first scene.
                </p>
              </>
            ) : (
              <>
                <Badge className="mb-4 border-primary/25 bg-primary/10 text-primary hover:bg-primary/10" variant="outline">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  Adult starter gate
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight">Confirm 18+ to browse starter characters.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Sessions can start from romantic, spicy, or explicit fictional adult characters. Minors, incest, bestiality, coercion, non-consent, sexual violence, and illegal sexual content are blocked.
                </p>
                <Button
                  onClick={() => {
                    confirmAdultContent();
                    setAdultConfirmed(true);
                  }}
                  className="mt-5 glow-primary"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  I am 18+ - Show starters
                </Button>
              </>
            )}
          </div>

          {adultConfirmed && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {seedCharacters.slice(0, 4).map(seed => (
                <SeedCharacterCard
                  key={seed.templateId}
                  seed={seed}
                  onStart={startSeedCharacter}
                  disabled={isStartingSeedCharacter}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(sessionsByCharacter ?? {}).map(([characterId, sessions]) => {
            const character = getCharacter(characterId);
            if (!sessions) return null;

            const displayName = character?.name ?? 'Unknown Character';
            const initials = displayName
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={characterId}>
                {/* Character header */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar 
                    className="h-10 w-10 border border-primary/35"
                    style={{ backgroundColor: character?.avatarUrl ? undefined : getAvatarColor(displayName) }}
                  >
                    <AvatarImage src={character?.avatarUrl} alt={displayName} />
                    <AvatarFallback 
                      className="font-semibold text-white"
                      style={{ backgroundColor: getAvatarColor(displayName) }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{displayName}</h2>
                    <p className="text-xs text-muted-foreground">
                      {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Sessions list */}
                <div className="ml-5 border-l-2 border-primary/30 pl-6 space-y-3">
                  {sessions.map(session => (
                    <Card key={session.id} className="premium-card group relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-4 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-medium truncate">
                              {session.title}
                            </CardTitle>
                            <CardDescription className="text-xs flex items-center gap-2">
                              <span>{formatDistanceToNow(session.updatedAt, { addSuffix: true })}</span>
                              {session.messageCount !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>{session.messageCount} messages</span>
                                </>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/chat/${characterId}`)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeletingSession(session)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSession} onOpenChange={() => setDeletingSession(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
