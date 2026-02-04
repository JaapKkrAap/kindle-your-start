import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CharacterFormData, Character } from '@/types';

const characterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  backstory: z.string().min(1, 'Backstory is required'),
  speechStyle: z.string().min(1, 'Speech style is required'),
  behavioralBoundaries: z.string(),
  firstMessage: z.string().min(1, 'First message is required'),
});

interface CharacterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CharacterFormData) => void;
  initialData?: Character;
  isLoading?: boolean;
}

const PERSONALITY_SUGGESTIONS = [
  'Brave', 'Mysterious', 'Sarcastic', 'Gentle', 'Fierce', 'Curious',
  'Stoic', 'Playful', 'Wise', 'Impulsive', 'Protective', 'Cunning',
  'Romantic', 'Dark', 'Noble', 'Rebellious', 'Loyal', 'Ambitious',
];

export function CharacterFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: CharacterFormDialogProps) {
  const [traits, setTraits] = useState<string[]>(initialData?.personalityTraits ?? []);
  const [newTrait, setNewTrait] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<z.infer<typeof characterSchema>>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      avatarUrl: initialData?.avatarUrl ?? '',
      backstory: initialData?.backstory ?? '',
      speechStyle: initialData?.speechStyle ?? '',
      behavioralBoundaries: initialData?.behavioralBoundaries ?? '',
      firstMessage: initialData?.firstMessage ?? '',
    },
  });

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name ?? '',
        avatarUrl: initialData?.avatarUrl ?? '',
        backstory: initialData?.backstory ?? '',
        speechStyle: initialData?.speechStyle ?? '',
        behavioralBoundaries: initialData?.behavioralBoundaries ?? '',
        firstMessage: initialData?.firstMessage ?? '',
      });
      setTraits(initialData?.personalityTraits ?? []);
    }
  }, [open, initialData, reset]);

  const addTrait = (trait: string) => {
    const trimmed = trait.trim();
    if (trimmed && !traits.includes(trimmed)) {
      setTraits([...traits, trimmed]);
    }
    setNewTrait('');
  };

  const removeTrait = (trait: string) => {
    setTraits(traits.filter(t => t !== trait));
  };

  const handleFormSubmit = (data: z.infer<typeof characterSchema>) => {
    onSubmit({
      name: data.name,
      avatarUrl: data.avatarUrl || undefined,
      backstory: data.backstory,
      personalityTraits: traits,
      speechStyle: data.speechStyle,
      behavioralBoundaries: data.behavioralBoundaries,
      firstMessage: data.firstMessage,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-2xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initialData ? 'Edit Character' : 'Create New Character'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Character Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter character name..."
                className="bg-muted/50"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Character Portrait (optional)</Label>
              <div className="flex items-center gap-4">
                <AvatarUpload
                  value={watch('avatarUrl')}
                  onChange={(url) => setValue('avatarUrl', url ?? '')}
                  placeholder={watch('name')?.charAt(0)?.toUpperCase() ?? 'C'}
                />
                <div className="flex-1 space-y-1">
                  <Input
                    {...register('avatarUrl')}
                    placeholder="Or paste image URL..."
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload an image or paste a URL
                  </p>
                </div>
              </div>
              {errors.avatarUrl && (
                <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>
              )}
            </div>

            {/* Personality Traits */}
            <div className="space-y-2">
              <Label>Personality Traits</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {traits.map(trait => (
                  <Badge
                    key={trait}
                    variant="secondary"
                    className="gap-1 bg-primary/20 hover:bg-primary/30"
                  >
                    {trait}
                    <button
                      type="button"
                      onClick={() => removeTrait(trait)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTrait}
                  onChange={e => setNewTrait(e.target.value)}
                  placeholder="Add custom trait..."
                  className="bg-muted/50"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTrait(newTrait);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addTrait(newTrait)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {PERSONALITY_SUGGESTIONS.filter(s => !traits.includes(s)).slice(0, 8).map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addTrait(suggestion)}
                    className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Backstory */}
            <div className="space-y-2">
              <Label htmlFor="backstory">Backstory</Label>
              <Textarea
                id="backstory"
                {...register('backstory')}
                placeholder="Describe this character's history, motivations, and background..."
                className="min-h-[120px] bg-muted/50"
              />
              {errors.backstory && (
                <p className="text-sm text-destructive">{errors.backstory.message}</p>
              )}
            </div>

            {/* Speech Style */}
            <div className="space-y-2">
              <Label htmlFor="speechStyle">Speech Style</Label>
              <Textarea
                id="speechStyle"
                {...register('speechStyle')}
                placeholder="How does this character speak? Formal, casual, archaic, modern slang..."
                className="min-h-[80px] bg-muted/50"
              />
              {errors.speechStyle && (
                <p className="text-sm text-destructive">{errors.speechStyle.message}</p>
              )}
            </div>

            {/* Behavioral Boundaries */}
            <div className="space-y-2">
              <Label htmlFor="behavioralBoundaries">Behavioral Boundaries (optional)</Label>
              <Textarea
                id="behavioralBoundaries"
                {...register('behavioralBoundaries')}
                placeholder="What will this character never do? What lines won't they cross?"
                className="min-h-[80px] bg-muted/50"
              />
            </div>

            {/* First Message */}
            <div className="space-y-2">
              <Label htmlFor="firstMessage">First Message</Label>
              <Textarea
                id="firstMessage"
                {...register('firstMessage')}
                placeholder="How does this character introduce themselves? Write their opening message..."
                className="min-h-[100px] bg-muted/50"
              />
              {errors.firstMessage && (
                <p className="text-sm text-destructive">{errors.firstMessage.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="glow-primary">
                {isLoading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Character'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
