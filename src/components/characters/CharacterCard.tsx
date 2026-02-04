import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Play, Edit, Copy, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Character } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Generate consistent color from name
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

interface CharacterCardProps {
  character: Character;
  onPlay: (character: Character) => void;
  onEdit: (character: Character) => void;
  onDuplicate: (character: Character) => void;
  onDelete: (character: Character) => void;
}

export function CharacterCard({ character, onPlay, onEdit, onDuplicate, onDelete }: CharacterCardProps) {
  const initials = character.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
        <CardContent className="p-0">
          {/* Portrait */}
          <div className="portrait-frame aspect-[3/4] bg-gradient-to-b from-muted to-background">
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div 
                className="flex h-full w-full items-center justify-center"
                style={{ backgroundColor: getAvatarColor(character.name) }}
              >
                <span className="text-5xl font-serif text-white/90">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent p-4">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {character.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {character.personalityTraits.slice(0, 3).join(' • ')}
            </p>
            {character.lastPlayedAt && (
              <p className="mt-2 text-xs text-muted-foreground/70">
                Last played: {formatRelativeTime(character.lastPlayedAt)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(character)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(character)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(character)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Play button overlay */}
          <button
            onClick={() => onPlay(character)}
            className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-all group-hover:bg-primary/10 group-hover:opacity-100"
          >
            <div className="rounded-full bg-primary p-4 shadow-lg glow-primary">
              <Play className="h-6 w-6 text-primary-foreground" />
            </div>
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
