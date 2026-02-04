import { Scroll, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCanonEvents, useDeleteCanonEvent } from '@/hooks/useCanonEvents';
import { useCharacters } from '@/hooks/useCharacters';
import { useToast } from '@/hooks/use-toast';

export default function CanonPage() {
  const { data: canonEvents, isLoading: loadingEvents } = useCanonEvents();
  const { data: characters } = useCharacters();
  const deleteCanonEvent = useDeleteCanonEvent();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    await deleteCanonEvent.mutateAsync(id);
    toast({
      title: 'Canon event deleted',
      description: 'The event has been removed from your story timeline.',
    });
  };

  const getCharacter = (characterId: string) => {
    return characters?.find(c => c.id === characterId);
  };

  // Group events by character
  const eventsByCharacter = canonEvents?.reduce((acc, event) => {
    const key = event.characterId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, typeof canonEvents>);

  if (loadingEvents) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Canon Events</h1>
        <p className="mt-1 text-muted-foreground">
          Your confirmed story timeline across all characters
        </p>
      </div>

      {!canonEvents?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-6">
            <Scroll className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold">No canon events yet</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Mark messages as canon during roleplay to build your story timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(eventsByCharacter ?? {}).map(([characterId, events]) => {
            const character = getCharacter(characterId);
            if (!character || !events) return null;

            const initials = character.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={characterId}>
                {/* Character header */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={character.avatarUrl} alt={character.name} />
                    <AvatarFallback className="bg-primary/20 font-serif">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-display font-semibold">{character.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {events.length} canon event{events.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link to={`/chat/${characterId}`} className="ml-auto">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Chat
                    </Button>
                  </Link>
                </div>

                {/* Timeline */}
                <div className="relative ml-5 border-l-2 border-primary/30 pl-6 space-y-4">
                  {events.map(event => (
                    <Card key={event.id} className="canon-marker relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-4 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-medium truncate">
                              {event.title}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {event.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
