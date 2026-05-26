import { Flame, Lock, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { contentRatingLabels } from '@/data/seedCharacters';
import type { SeedCharacterTemplate } from '@/types';

interface SeedCharacterCardProps {
  seed: SeedCharacterTemplate;
  onStart: (seed: SeedCharacterTemplate) => void;
  disabled?: boolean;
}

export function SeedCharacterCard({ seed, onStart, disabled }: SeedCharacterCardProps) {
  const initials = seed.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="premium-card group overflow-hidden">
      <CardContent className="p-0">
        <div
          className="relative flex aspect-[4/5] items-end overflow-hidden p-4"
          style={{
            background: `linear-gradient(145deg, hsl(${seed.accent} / 0.95), hsl(222 24% 8%))`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,hsl(0_0%_100%/0.18),transparent_34%)]" />
          <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/18 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur">
            {seed.age}+
          </div>
          <div className="absolute left-1/2 top-[38%] flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-black/22 text-3xl font-semibold text-white/90 ring-1 ring-white/20">
            {seed.portraitPath ? (
              <img
                src={seed.portraitPath}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              initials
            )}
          </div>
          <div className="relative z-10 w-full">
            <Badge className="mb-2 bg-background/75 text-foreground hover:bg-background/75">
              {contentRatingLabels[seed.contentRating]}
            </Badge>
            <h3 className="text-lg font-semibold text-white">{seed.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/74">{seed.previewLine}</p>
          </div>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-1.5">
            {seed.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="border-border/70 text-[10px] text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {seed.contentRating === 'explicit' ? <Lock className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
              {seed.popularity}
            </span>
            <Button size="sm" onClick={() => onStart(seed)} disabled={disabled} className="h-8 gap-2">
              <Play className="h-3.5 w-3.5" />
              Start
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
