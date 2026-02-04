import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { useCharacter } from '@/hooks/useCharacters';
import { usePersonas } from '@/hooks/usePersonas';
import { useChatMessages, useAddChatMessage, useCreateChatSession, useToggleCanon } from '@/hooks/useChatSessions';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '@/types';

export default function ChatPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: character, isLoading: loadingCharacter } = useCharacter(characterId);
  const { data: personas } = usePersonas();
  const createSession = useCreateChatSession();
  const addMessage = useAddChatMessage();
  const toggleCanon = useToggleCanon();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activePersonaId, setActivePersonaId] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  
  const { data: dbMessages } = useChatMessages(sessionId ?? undefined);
  const messages = dbMessages ?? localMessages;

  const scrollRef = useRef<HTMLDivElement>(null);
  const activePersona = personas?.find(p => p.id === activePersonaId);

  // Create session on mount
  useEffect(() => {
    if (character && !sessionId) {
      createSession.mutateAsync({
        characterId: character.id,
        personaId: activePersonaId,
        title: `Session with ${character.name}`,
      }).then(session => {
        setSessionId(session.id);
        // Add character's first message
        if (character.firstMessage) {
          addMessage.mutate({
            sessionId: session.id,
            characterId: character.id,
            personaId: activePersonaId,
            role: 'character',
            content: character.firstMessage,
          });
        }
      });
    }
  }, [character]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (content: string) => {
    if (!sessionId || !character) return;

    // Add user message
    await addMessage.mutateAsync({
      sessionId,
      characterId: character.id,
      personaId: activePersonaId,
      role: 'user',
      content,
    });

    // Simulate AI response (placeholder until AI integration)
    setIsTyping(true);
    setTimeout(async () => {
      await addMessage.mutateAsync({
        sessionId,
        characterId: character.id,
        personaId: activePersonaId,
        role: 'character',
        content: `*${character.name} considers your words carefully before responding.*\n\nThis is a placeholder response. AI integration will be configured in settings.`,
      });
      setIsTyping(false);
    }, 1500);
  };

  const handleToggleCanon = (id: string, isCanon: boolean) => {
    toggleCanon.mutate({ id, isCanon });
    toast({
      title: isCanon ? 'Marked as canon' : 'Removed from canon',
      description: isCanon ? 'This moment is now part of the story.' : 'This moment is no longer canon.',
    });
  };

  const handleEdit = (id: string) => {
    toast({
      title: 'Edit message',
      description: 'Message editing coming soon!',
    });
  };

  const handleRegenerate = (id: string) => {
    toast({
      title: 'Regenerate',
      description: 'Response regeneration coming soon!',
    });
  };

  if (loadingCharacter) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Character not found</p>
        <Button onClick={() => navigate('/')}>Back to Characters</Button>
      </div>
    );
  }

  const characterInitials = character.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Character info */}
        <Avatar className="h-10 w-10 border-2 border-primary/50">
          <AvatarImage src={character.avatarUrl} alt={character.name} />
          <AvatarFallback className="bg-primary/20 font-serif">{characterInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold truncate">{character.name}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {character.personalityTraits.slice(0, 3).join(' • ')}
          </p>
        </div>

        {/* Persona selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              {activePersona?.name ?? 'No Persona'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setActivePersonaId(undefined)}>
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              No Persona (You)
            </DropdownMenuItem>
            {personas?.map(persona => (
              <DropdownMenuItem
                key={persona.id}
                onClick={() => setActivePersonaId(persona.id)}
              >
                <User className="mr-2 h-4 w-4" />
                {persona.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="py-4">
          {messages.map(message => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              character={character}
              persona={activePersona}
              onToggleCanon={handleToggleCanon}
              onEdit={handleEdit}
              onRegenerate={message.role === 'character' ? handleRegenerate : undefined}
            />
          ))}
          <AnimatePresence>
            {isTyping && <TypingIndicator characterName={character.name} />}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isLoading={addMessage.isPending || isTyping}
        placeholder={`Message ${character.name}...`}
      />
    </div>
  );
}
