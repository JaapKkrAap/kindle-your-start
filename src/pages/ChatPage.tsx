import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { SessionPicker } from '@/components/chat/SessionPicker';
import { ScrollToBottomButton } from '@/components/chat/ScrollToBottomButton';
import { ChatLoadingSkeleton } from '@/components/ui/skeletons';
import { useCharacter } from '@/hooks/useCharacters';
import { useMemories } from '@/hooks/useMemories';
import { useCanonEvents, useCreateCanonEvent, useDeleteCanonEvent } from '@/hooks/useCanonEvents';
import { usePersonas } from '@/hooks/usePersonas';
import { 
  useChatSessions, 
  useChatMessages, 
  useAddChatMessage, 
  useCreateChatSession, 
  useToggleCanon,
  useUpdateSession,
  useUpdateMessage,
  useDeleteMessagesAfter,
} from '@/hooks/useChatSessions';
import { useAISettings } from '@/hooks/useAISettings';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { sendChatMessage } from '@/lib/ai';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '@/types';

// Generate consistent color from name
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

export default function ChatPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: character, isLoading: loadingCharacter } = useCharacter(characterId);
  const { data: personas } = usePersonas();
  const { data: aiSettings } = useAISettings();
  const { data: sessions, isLoading: loadingSessions } = useChatSessions(characterId);
  
  const createSession = useCreateChatSession();
  const addMessage = useAddChatMessage();
  const toggleCanon = useToggleCanon();
  const updateSession = useUpdateSession();
  const updateMessage = useUpdateMessage();
  const deleteMessagesAfter = useDeleteMessagesAfter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activePersonaId, setActivePersonaId] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch memories and canon events
  const { data: memories } = useMemories(characterId, activePersonaId);
  const { data: canonEvents } = useCanonEvents(characterId);
  const createCanonEvent = useCreateCanonEvent();
  const deleteCanonEvent = useDeleteCanonEvent();
  
  const { data: dbMessages, isLoading: loadingMessages } = useChatMessages(sessionId ?? undefined);
  const messages = dbMessages ?? localMessages;

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const activePersona = personas?.find(p => p.id === activePersonaId);
  const isCreatingSession = useRef(false);

  // Keyboard shortcut: Cmd/Ctrl+K to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        chatInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle new session creation
  const handleNewSession = useCallback(async () => {
    if (!character || isCreatingSession.current) return;
    
    isCreatingSession.current = true;
    try {
      const session = await createSession.mutateAsync({
        characterId: character.id,
        personaId: activePersonaId,
        title: `Session with ${character.name}`,
      });
      setSessionId(session.id);
      
      // Add character's first message
      if (character.firstMessage) {
        await addMessage.mutateAsync({
          sessionId: session.id,
          characterId: character.id,
          personaId: activePersonaId,
          role: 'character',
          content: character.firstMessage,
        });
      }
    } finally {
      isCreatingSession.current = false;
    }
  }, [character, activePersonaId, createSession, addMessage]);

  // Session selection logic - resume most recent or create new
  useEffect(() => {
    if (loadingSessions || !character) return;
    
    if (sessions?.length && !sessionId) {
      // Resume most recent session
      setSessionId(sessions[0].id);
    } else if (!sessions?.length && !sessionId) {
      // No sessions exist - create first one
      handleNewSession();
    }
  }, [sessions, loadingSessions, sessionId, character, handleNewSession]);

  // Smooth scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  // Handle session switch
  const handleSelectSession = (id: string) => {
    setSessionId(id);
    setIsTyping(false);
  };

  const handleSend = async (content: string) => {
    if (!sessionId || !character || !aiSettings) return;

    // Check if this is the first user message - auto-title
    const isFirstUserMessage = !messages.some(m => m.role === 'user');
    if (isFirstUserMessage) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      updateSession.mutate({ id: sessionId, title });
    }

    // Add user message
    await addMessage.mutateAsync({
      sessionId,
      characterId: character.id,
      personaId: activePersonaId,
      role: 'user',
      content,
    });

    // Prepare messages for AI
    const chatHistory = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    chatHistory.push({ role: 'user', content });

    setIsTyping(true);

    try {
      const response = await sendChatMessage({
        messages: chatHistory,
        character,
        persona: activePersona,
        memories: memories?.map(m => m.content) ?? [],
        canonEvents: canonEvents?.map(e => ({
          title: e.title,
          description: e.description,
        })) ?? [],
        settings: aiSettings,
      });

      await addMessage.mutateAsync({
        sessionId,
        characterId: character.id,
        personaId: activePersonaId,
        role: 'character',
        content: response.content,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      toast({
        title: 'AI Error',
        description: errorMessage,
        variant: 'destructive',
        action: (
          <ToastAction altText="Retry" onClick={() => handleSend(content)}>
            Retry
          </ToastAction>
        ),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleToggleCanon = async (id: string, isCanon: boolean) => {
    const message = messages.find(m => m.id === id);
    if (!message || !character) return;

    // Update message flag
    await toggleCanon.mutateAsync({ id, isCanon });

    if (isCanon) {
      // Create canon event
      await createCanonEvent.mutateAsync({
        characterId: character.id,
        personaId: activePersonaId,
        title: message.content.slice(0, 100),
        description: message.content,
        sourceMessageIds: [message.id],
        eventTimestamp: message.createdAt,
      });
    } else {
      // Find and delete linked canon event
      const linkedEvent = canonEvents?.find(e => 
        e.sourceMessageIds.includes(message.id)
      );
      if (linkedEvent) {
        await deleteCanonEvent.mutateAsync(linkedEvent.id);
      }
    }

    toast({
      title: isCanon ? 'Marked as canon' : 'Removed from canon',
      description: isCanon ? 'This moment is now part of the story.' : 'This moment is no longer canon.',
    });
  };

  const handleEdit = (id: string) => {
    const message = messages.find(m => m.id === id);
    if (message) {
      setEditingMessageId(id);
      setEditContent(message.content);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;
    
    try {
      await updateMessage.mutateAsync({ 
        id: editingMessageId, 
        content: editContent 
      });
      setEditingMessageId(null);
      setEditContent('');
      toast({
        title: 'Message updated',
        description: 'Your edit has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!sessionId || !character || !aiSettings || isTyping) return;
    
    const messageIndex = messages.findIndex(m => m.id === id);
    if (messageIndex === -1) return;
    
    const targetMessage = messages[messageIndex];
    
    // Delete this message and everything after it
    await deleteMessagesAfter.mutateAsync({
      sessionId,
      afterTimestamp: targetMessage.createdAt,
    });
    
    // Get conversation up to (but not including) the deleted message
    const previousMessages = messages.slice(0, messageIndex);
    
    // Build chat history
    const chatHistory = previousMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    
    setIsTyping(true);
    
    try {
      const response = await sendChatMessage({
        messages: chatHistory,
        character,
        persona: activePersona,
        memories: memories?.map(m => m.content) ?? [],
        canonEvents: canonEvents?.map(e => ({
          title: e.title,
          description: e.description,
        })) ?? [],
        settings: aiSettings,
      });
      
      await addMessage.mutateAsync({
        sessionId,
        characterId: character.id,
        personaId: activePersonaId,
        role: 'character',
        content: response.content,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate';
      toast({
        title: 'Regeneration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (loadingCharacter || loadingSessions) {
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
    <div className="flex h-full flex-col relative">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Character info */}
        <Avatar className="h-10 w-10 border-2 border-primary/50">
          <AvatarImage src={character.avatarUrl} alt={character.name} />
          <AvatarFallback 
            className="font-serif text-white"
            style={{ backgroundColor: getAvatarColor(character.name) }}
          >
            {characterInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold truncate">{character.name}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {character.personalityTraits.slice(0, 3).join(' • ')}
          </p>
        </div>

        {/* Session picker */}
        <SessionPicker
          sessions={sessions ?? []}
          currentSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          isLoading={createSession.isPending}
        />

        {/* Persona selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              {activePersona?.name ?? 'No Persona'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
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
      <ScrollArea 
        ref={scrollRef} 
        className="flex-1"
        onScrollCapture={handleScroll}
      >
        {loadingMessages ? (
          <ChatLoadingSkeleton />
        ) : (
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
        )}
      </ScrollArea>

      {/* Scroll to bottom button */}
      <ScrollToBottomButton visible={showScrollButton} onClick={scrollToBottom} />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isLoading={addMessage.isPending || isTyping}
        placeholder={`Message ${character.name}...`}
        inputRef={chatInputRef}
      />

      {/* Edit Message Dialog */}
      <Dialog open={!!editingMessageId} onOpenChange={() => setEditingMessageId(null)}>
        <DialogContent className="max-w-2xl border-border bg-background">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[150px] bg-muted/50"
            placeholder="Edit your message..."
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingMessageId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMessage.isPending || !editContent.trim()}>
              {updateMessage.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
