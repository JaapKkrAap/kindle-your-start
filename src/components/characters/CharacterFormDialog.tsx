// @ts-nocheck
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { AvatarUpload } from '../ui/avatar-upload';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import type { CharacterFormData, Character } from '../../types';

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

const GENRE_OPTIONS = ['Fantasy', 'Sci-Fi', 'Modern', 'Historical', 'Horror', 'Romance', 'Other'];
const CHARACTER_TYPE_OPTIONS = ['Protagonist', 'Antagonist', 'Mentor', 'Companion', 'Trickster', 'Stranger'];
const TONE_OPTIONS = ['Serious', 'Playful', 'Dark', 'Romantic', 'Mysterious', 'Warm'];

export function CharacterFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: CharacterFormDialogProps) {
  const [traits, setTraits] = useState<string[]>(initialData?.personalityTraits ?? []);
  const [newTrait, setNewTrait] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [genre, setGenre] = useState('');
  const [characterType, setCharacterType] = useState('');
  const [tone, setTone] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
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
      setShowPreferences(false);
      setGenre('');
      setCharacterType('');
      setTone('');
    }
  }, [open, initialData, reset]);

  const isFormEmpty = () => {
    const vals = getValues();
    return (
      !vals.name?.trim() &&
      !vals.backstory?.trim() &&
      !vals.speechStyle?.trim() &&
      !vals.behavioralBoundaries?.trim() &&
      !vals.firstMessage?.trim() &&
      traits.length === 0
    );
  };

  const handleGenerate = async () => {
    // If not showing preferences and form is empty, or user wants to refine
    if (!showPreferences && (isFormEmpty() || !genre || !characterType || !tone)) {
      setShowPreferences(true);
      return;
    }

    setIsGenerating(true);
    try {
      const vals = getValues();
      const { data, error } = await supabase.functions.invoke('generate-character', {
        body: {
          existingData: {
            name: vals.name || '',
            backstory: vals.backstory || '',
            personalityTraits: traits,
            speechStyle: vals.speechStyle || '',
            behavioralBoundaries: vals.behavioralBoundaries || '',
            firstMessage: vals.firstMessage || '',
          },
          preferences: (genre || characterType || tone) ? {
            genre: genre || undefined,
            characterType: characterType || undefined,
            tone: tone || undefined,
          } : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Fill empty fields
      if (!vals.name?.trim() && data.name) setValue('name', data.name);
      if (!vals.backstory?.trim() && data.backstory) setValue('backstory', data.backstory);
      if (!vals.speechStyle?.trim() && data.speechStyle) setValue('speechStyle', data.speechStyle);
      if (!vals.behavioralBoundaries?.trim() && data.behavioralBoundaries) setValue('behavioralBoundaries', data.behavioralBoundaries);
      if (!vals.firstMessage?.trim() && data.firstMessage) setValue('firstMessage', data.firstMessage);

      if (data.personalityTraits?.length) {
        // Only add traits that aren't already there
        const filteredNewTraits = data.personalityTraits.filter(t => !traits.includes(t));
        if (filteredNewTraits.length > 0) {
          setTraits(prev => [...prev, ...filteredNewTraits]);
        }
      }

      setShowPreferences(false);
      toast.success('Character updated with AI!');
    } catch (err: unknown) {
      console.error('Generate error:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate character';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl">
              {initialData ? 'Edit Character' : 'Create New Character'}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-1.5 border-primary/30 hover:bg-primary/10"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Preferences Panel */}
            {showPreferences && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Tell me a bit about the character you want:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger className="bg-muted/50 h-9">
                        <SelectValue placeholder="Pick..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRE_OPTIONS.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={characterType} onValueChange={setCharacterType}>
                      <SelectTrigger className="bg-muted/50 h-9">
                        <SelectValue placeholder="Pick..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CHARACTER_TYPE_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="bg-muted/50 h-9">
                        <SelectValue placeholder="Pick..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full gap-1.5"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate Character
                </Button>
              </div>
            )}

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
                      title={`Remove ${trait}`}
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
