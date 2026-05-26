import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getAvatarProps } from '@/lib/avatar-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookMarked, Edit, RefreshCw } from 'lucide-react';
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
  const { color, initials } = getAvatarProps(displayName);

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
        'group flex gap-3 px-4 py-3',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Avatar className={cn(
          'h-10 w-10 border shadow-sm',
          isUser ? 'border-primary/55' : 'border-border'
        )}>
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback
            className="text-sm font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={cn('max-w-[82%] flex-1', isUser ? 'flex flex-col items-end' : '')}>
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
            'max-w-[92%] rounded-lg px-4 py-3 shadow-sm transition-all duration-200',
            isUser
              ? 'bubble-user ml-auto'
              : 'bubble-character mr-auto',
            message.isCanon && 'canon-marker'
          )}
          style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
        >
          <p className="m-0 whitespace-pre-wrap text-sm leading-7">
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
            className="h-7 rounded-md px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => onToggleCanon(message.id, !message.isCanon)}
          >
            <BookMarked className={cn('h-3 w-3 mr-1', message.isCanon && 'text-primary')} />
            {message.isCanon ? 'Canon' : 'Canon'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-md px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(message.id)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {!isUser && onRegenerate && (
            <RegeneratePopover
              messageId={message.id}
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
  onRegenerate
}: {
  messageId: string;
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
          className="h-7 rounded-md px-2 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Redo
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
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
