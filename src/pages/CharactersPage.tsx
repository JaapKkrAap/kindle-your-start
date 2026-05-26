import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CharacterCard } from '@/components/characters/CharacterCard';
import { CharacterFormDialog } from '@/components/characters/CharacterFormDialog';
import { SeedCharacterCard } from '@/components/characters/SeedCharacterCard';
import { PageShell } from '@/components/layout/PageShell';
import {
  confirmAdultContent,
  contentRatingLabels,
  isAdultContentConfirmed,
  seedCategories,
  seedCharacters,
} from '@/data/seedCharacters';
import { useCharacters, useCreateCharacter, useUpdateCharacter, useDeleteCharacter } from '@/hooks/useCharacters';
import { useStartSeedCharacter } from '@/hooks/useStartSeedCharacter';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import type { Character, CharacterFormData } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CharactersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: characters, isLoading } = useCharacters();
  const createCharacter = useCreateCharacter();
  const updateCharacter = useUpdateCharacter();
  const deleteCharacter = useDeleteCharacter();
  const { startSeedCharacter, isStartingSeedCharacter } = useStartSeedCharacter();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [deletingCharacter, setDeletingCharacter] = useState<Character | null>(null);
  const [adultConfirmed, setAdultConfirmed] = useState(() => isAdultContentConfirmed());

  const handleConfirmAdult = () => {
    confirmAdultContent();
    setAdultConfirmed(true);
  };

  const handleCreate = async (data: CharacterFormData) => {
    try {
      const created = await createCharacter.mutateAsync(data);
      setShowCreateDialog(false);
      toast({
        title: 'Character created',
        description: `${created.name} is ready for roleplay!`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create character',
        variant: 'destructive',
        action: (
          <ToastAction altText="Retry" onClick={() => handleCreate(data)}>
            Retry
          </ToastAction>
        ),
      });
    }
  };

  const handlePlay = (character: Character) => {
    navigate(`/chat/${character.id}`);
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
  };

  const handleDuplicate = async (character: Character) => {
    try {
      await createCharacter.mutateAsync({
        name: `${character.name} (Copy)`,
        avatarUrl: character.avatarUrl,
        backstory: character.backstory,
        personalityTraits: character.personalityTraits,
        speechStyle: character.speechStyle,
        behavioralBoundaries: character.behavioralBoundaries,
        firstMessage: character.firstMessage,
      });
      toast({
        title: 'Character duplicated',
        description: `Created a copy of ${character.name}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate character',
        variant: 'destructive',
        action: (
          <ToastAction altText="Retry" onClick={() => handleDuplicate(character)}>
            Retry
          </ToastAction>
        ),
      });
    }
  };
  const handleDelete = async () => {
    if (!deletingCharacter) return;
    try {
      await deleteCharacter.mutateAsync(deletingCharacter.id);
      setDeletingCharacter(null);
      toast({
        title: 'Character deleted',
        description: `${deletingCharacter.name} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete character',
        variant: 'destructive',
        action: (
          <ToastAction altText="Retry" onClick={handleDelete}>
            Retry
          </ToastAction>
        ),
      });
    }
  };

  return (
    <PageShell
      title="Discover"
      description="Browse adult fictional characters, pick a mood, and start a scene instantly."
      meta={
        adultConfirmed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            18+ fictional adults only
          </span>
        ) : undefined
      }
      action={
        <Button onClick={() => setShowCreateDialog(true)} className="glow-primary">
          <Plus className="mr-2 h-4 w-4" />
          New Character
        </Button>
      }
    >

      {!adultConfirmed ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="premium-card flex min-h-[420px] flex-col justify-center p-8">
            <Badge className="mb-5 w-fit border-primary/25 bg-primary/10 text-primary hover:bg-primary/10" variant="outline">
              Adult discovery gate
            </Badge>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Enter the adult-only discovery mode.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Discovery contains romantic, spicy, and explicit fictional roleplay prompts. You must be 18 or older to continue.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/25 p-4">
                <p className="font-medium text-foreground">Allowed posture</p>
                <p className="mt-1 leading-6">Fictional consenting adults only, with boundaries respected in every scene.</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/25 p-4">
                <p className="font-medium text-foreground">Blocked content</p>
                <p className="mt-1 leading-6">No minors, incest, bestiality, coercion, non-consent, sexual violence, or illegal sexual content.</p>
              </div>
            </div>
            <Button onClick={handleConfirmAdult} className="mt-7 w-fit glow-primary">
              <ShieldCheck className="mr-2 h-4 w-4" />
              I am 18+ - Enter discovery
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[0, 1, 2].map(index => (
              <div key={index} className="premium-card overflow-hidden p-4 opacity-70">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-muted/45" />
                  <div className="min-w-0">
                    <div className="h-4 w-32 rounded bg-muted/55" />
                    <div className="mt-3 h-3 w-48 max-w-full rounded bg-muted/35" />
                    <div className="mt-2 h-3 w-36 rounded bg-muted/25" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <Badge className="mb-3 border-primary/25 bg-primary/10 text-primary hover:bg-primary/10" variant="outline">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Trending tonight
                </Badge>
                <h2 className="text-xl font-semibold">Start with the strongest hooks</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each starter copies into your private character library on first chat.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(contentRatingLabels).map(([rating, label]) => (
                  <Badge key={rating} variant="outline" className="border-border/70 text-muted-foreground">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {seedCharacters.slice(0, 6).map(seed => (
                <SeedCharacterCard
                  key={seed.templateId}
                  seed={seed}
                  onStart={startSeedCharacter}
                  disabled={isStartingSeedCharacter}
                />
              ))}
            </div>
          </section>

          {seedCategories.map(category => {
            const categorySeeds = seedCharacters.filter(seed => seed.category === category);
            return (
              <section key={category} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{category}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Adult fictional characters with consent-forward boundaries and quick-start scenes.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {categorySeeds.map(seed => (
                    <SeedCharacterCard
                      key={seed.templateId}
                      seed={seed}
                      onStart={startSeedCharacter}
                      disabled={isStartingSeedCharacter}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-lg font-semibold">Your characters</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Started templates and custom studio characters appear here for editing and replay.
                </p>
              </div>
              {characters?.length ? (
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
                  {characters.length} character{characters.length === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="premium-card overflow-hidden">
                    <Skeleton className="aspect-[3/4]" />
                  </div>
                ))}
              </div>
            ) : characters && characters.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {characters.map(character => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    onPlay={handlePlay}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={setDeletingCharacter}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-6 text-sm text-muted-foreground">
                Tap Start on any starter character to copy them into your private library.
              </div>
            )}
          </section>
        </div>
      )}

      {/* Create Dialog */}
      <CharacterFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        isLoading={createCharacter.isPending}
      />

      {/* Edit Dialog */}
      {editingCharacter && (
        <CharacterFormDialog
          open={!!editingCharacter}
          onOpenChange={() => setEditingCharacter(null)}
          onSubmit={async (data) => {
            try {
              await updateCharacter.mutateAsync({ id: editingCharacter.id, data });
              setEditingCharacter(null);
              toast({
                title: 'Character updated',
                description: `${data.name} has been updated`,
              });
            } catch (error) {
              toast({
                title: 'Error',
                description: 'Failed to update character',
                variant: 'destructive',
                action: (
                  <ToastAction altText="Retry" onClick={() => updateCharacter.mutate({ id: editingCharacter.id, data })}>
                    Retry
                  </ToastAction>
                ),
              });
            }
          }}
          initialData={editingCharacter}
          isLoading={updateCharacter.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCharacter} onOpenChange={() => setDeletingCharacter(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingCharacter?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this character and all their memories and chat history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
