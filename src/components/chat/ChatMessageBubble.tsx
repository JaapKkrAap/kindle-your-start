import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookMarked, Edit, RefreshCw, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ChatMessage, Character, UserPersona } from '@/types';
import { motion } from 'framer-motion';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  character: Character;
  persona?: UserPersona;
  onToggleCanon: (id: string, isCanon: boolean) => void;
  onEdit: (id: string) => void;
  onRegenerate?: (id: string, instruction?: string) => void;
}

// Generate consistent color from name
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

export function ChatMessageBubble({
  message,
  character,
  persona,
  onToggleCanon,
  onEdit,
  onRegenerate,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center py-4"
      >
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px w-8 bg-border" />
          <span className="italic">{message.content}</span>
          <span className="h-px w-8 bg-border" />
        </div>
      </motion.div>
    );
  }

  const displayName = isUser ? (persona?.name ?? 'You') : character.name;
  const avatarUrl = isUser ? persona?.avatarUrl : character.avatarUrl;
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Parse content to render italics for actions
  const renderContent = (content: string) => {
    const parts = content.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="text-muted-foreground">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group flex gap-3 px-4 py-2',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Avatar className={cn(
          'h-11 w-11 border-2',
          isUser ? 'border-primary/60' : 'border-accent'
        )}>
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback 
            className="text-sm font-medium text-white"
            style={{ backgroundColor: getAvatarColor(displayName) }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 max-w-[80%]', isUser ? 'flex flex-col items-end' : '')}>
        {/* Name */}
        <div className={cn(
          'flex items-center gap-2 mb-1 px-1',
          isUser ? 'flex-row-reverse' : ''
        )}>
          <span className="text-sm font-medium text-foreground">
            {displayName}
          </span>
          {message.isCanon && (
            <BookMarked className="h-3 w-3 text-primary" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'prose-roleplay rounded-2xl px-4 py-3 relative',
            isUser ? 'bubble-user' : 'bubble-character',
            message.isCanon && !isUser && 'border-l-2 border-l-primary'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap m-0">
            {renderContent(message.content)}
          </p>
          
          {/* Timestamp inside bubble */}
          <div className={cn(
            'flex items-center gap-1 mt-2 text-[10px]',
            isUser ? 'text-primary-foreground/60 justify-end' : 'text-muted-foreground justify-end'
          )}>
            {message.editedAt && <span>(edited)</span>}
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </div>

        {/* Actions - below bubble */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1',
            isUser ? 'flex-row-reverse' : ''
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => onToggleCanon(message.id, !message.isCanon)}
          >
            <BookMarked className={cn('h-3 w-3 mr-1', message.isCanon && 'text-primary')} />
            {message.isCanon ? 'Canon' : 'Canon'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(message.id)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {!isUser && onRegenerate && (
            <RegeneratePopover
              messageId={message.id}
              characterName={character.name}
              onRegenerate={onRegenerate} 
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Regenerate popover component
function RegeneratePopover({ 
  messageId, 
  characterName,
  onRegenerate 
}: { 
  messageId: string; 
  characterName: string;
  onRegenerate: (id: string, instruction?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');

  const handleRegenerate = (instruction?: string) => {
    onRegenerate(messageId, instruction);
    setOpen(false);
    setCustomInstruction('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Redo
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {/* Perspective indicator */}
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-md bg-accent/50 border border-border/50">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              Writing as {characterName}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={() => handleRegenerate()}
          >
            Same intent
          </Button>
          <div className="relative">
            <Input
              placeholder="Custom instruction..."
              className="h-8 text-xs pr-8"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customInstruction.trim()) {
                  handleRegenerate(customInstruction.trim());
                }
              }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              ↵
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
