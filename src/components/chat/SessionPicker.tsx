import { MessageSquarePlus, MessageSquare, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ChatSession } from '@/types';

interface SessionPickerProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  isLoading?: boolean;
}

export function SessionPicker({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  isLoading,
}: SessionPickerProps) {
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const displayTitle = currentSession?.title ?? 'Select Session';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[200px]" disabled={isLoading}>
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span className="truncate">{displayTitle}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] bg-popover">
        <DropdownMenuItem onClick={onNewSession} className="gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          New Session
        </DropdownMenuItem>
        
        {sessions.length > 0 && <DropdownMenuSeparator />}
        
        {sessions.map(session => (
          <DropdownMenuItem
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className="flex items-start gap-2 py-2"
          >
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">
                  {session.title}
                </span>
                {session.id === currentSessionId && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(session.updatedAt, { addSuffix: true })}</span>
                <span>•</span>
                <span>{session.messageCount ?? 0} messages</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        {sessions.length === 0 && (
          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
            No sessions yet
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
