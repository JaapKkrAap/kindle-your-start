import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookMarked, Edit, RefreshCw, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ChatMessage, Character, UserPersona } from '@/types';
import { motion } from 'framer-motion';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  character: Character;
  persona?: UserPersona;
  onToggleCanon: (id: string, isCanon: boolean) => void;
  onEdit: (id: string) => void;
  onRegenerate?: (id: string) => void;
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
        className="flex justify-center py-2"
      >
        <div className="text-xs text-muted-foreground italic px-4 py-2 rounded-full bg-muted/30">
          {message.content}
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
          <em key={i} className="text-muted-foreground not-italic italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group flex gap-3 px-4 py-3',
        isUser ? 'flex-row-reverse' : '',
        message.isCanon && 'canon-marker'
      )}
    >
      {/* Avatar */}
      <Avatar className={cn(
        'h-10 w-10 shrink-0 border-2',
        isUser ? 'border-accent/50' : 'border-primary/50'
      )}>
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className={cn(
          'font-serif',
          isUser ? 'bg-accent/20' : 'bg-primary/20'
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn('flex-1 space-y-1', isUser ? 'text-right' : '')}>
        <div className={cn('flex items-center gap-2', isUser ? 'justify-end' : '')}>
          <span className="font-display text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {message.editedAt && (
            <span className="text-xs text-muted-foreground/70">(edited)</span>
          )}
          {message.isCanon && (
            <BookMarked className="h-3 w-3 text-primary" />
          )}
        </div>

        <div
          className={cn(
            'prose-roleplay rounded-lg px-4 py-3 inline-block max-w-[85%]',
            isUser
              ? 'bg-accent/20 text-left ml-auto'
              : 'bg-muted/50 text-left'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderContent(message.content)}
          </p>
        </div>

        {/* Actions */}
        <div
          className={cn(
            'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isUser ? 'justify-end' : ''
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onToggleCanon(message.id, !message.isCanon)}
          >
            <BookMarked className={cn('h-3 w-3 mr-1', message.isCanon && 'text-primary')} />
            {message.isCanon ? 'Canon' : 'Mark Canon'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onEdit(message.id)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {!isUser && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onRegenerate(message.id)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
