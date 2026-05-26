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
import { getAvatarProps } from '@/lib/avatar-utils';
import { motion } from 'framer-motion';

interface CharacterCardProps {
  character: Character;
  onPlay: (character: Character) => void;
  onEdit: (character: Character) => void;
  onDuplicate: (character: Character) => void;
  onDelete: (character: Character) => void;
}

export function CharacterCard({ character, onPlay, onEdit, onDuplicate, onDelete }: CharacterCardProps) {
  const { color, initials } = getAvatarProps(character.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      transition={{ duration: 0.3 }}
    >
      <Card className="premium-card group relative overflow-hidden">
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
                style={{ backgroundColor: color }}
              >
            <span className="text-4xl font-semibold text-white/90">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent p-4">
            {/* Character info */}
            <div className="space-y-1">
              <h3 className="truncate text-base font-semibold text-foreground" title={character.name}>
                {character.name}
              </h3>
              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                {character.personalityTraits.slice(0, 3).join(' / ') || 'Ready for a new scene'}
              </p>
            </div>
            {character.lastPlayedAt && (
              <p className="mt-2 text-xs text-muted-foreground/70">
                Last played: {formatRelativeTime(character.lastPlayedAt)}
              </p>
            )}
          </div>

          {/* Actions - higher z-index to stay above play overlay */}
          <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-popover">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(character); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(character); }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(character); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Play button overlay - exclude top area for dropdown */}
          <button
            onClick={() => onPlay(character)}
            aria-label={`Start roleplay with ${character.name}`}
            className="absolute inset-0 top-12 z-10 flex items-center justify-center bg-primary/0 opacity-0 transition-all duration-300 group-hover:bg-primary/10 group-hover:opacity-100"
          >
            <motion.div
              className="rounded-lg bg-primary p-4 shadow-lg glow-primary"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="h-6 w-6 text-primary-foreground" />
            </motion.div>
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
