import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserPersona } from '@/types';
import { motion } from 'framer-motion';

interface PersonaCardProps {
  persona: UserPersona;
  isActive?: boolean;
  onSelect: (persona: UserPersona) => void;
  onEdit: (persona: UserPersona) => void;
  onDelete: (persona: UserPersona) => void;
}

export function PersonaCard({ persona, isActive, onSelect, onEdit, onDelete }: PersonaCardProps) {
  const initials = persona.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`glass-card group cursor-pointer transition-all hover:border-accent/50 ${
          isActive ? 'border-accent glow-accent' : ''
        }`}
        onClick={() => onSelect(persona)}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {/* Avatar */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-accent/30 to-primary/20">
            {persona.avatarUrl ? (
              <img
                src={persona.avatarUrl}
                alt={persona.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-serif text-lg text-foreground/70">
                  {initials}
                </span>
              </div>
            )}
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-accent/30">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate">
              {persona.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {persona.defaultTone} • {persona.personalityTraits.slice(0, 2).join(', ')}
            </p>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(persona); }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(persona); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </motion.div>
  );
}
