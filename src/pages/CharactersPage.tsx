import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CharacterCard } from '@/components/characters/CharacterCard';
import { CharacterFormDialog } from '@/components/characters/CharacterFormDialog';
import { PageShell } from '@/components/layout/PageShell';
import { useCharacters, useCreateCharacter, useUpdateCharacter, useDeleteCharacter } from '@/hooks/useCharacters';
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

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [deletingCharacter, setDeletingCharacter] = useState<Character | null>(null);

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
      title="Characters"
      description="Shape your cast, revisit favorite scenes, and jump into character-driven conversations."
      meta={characters?.length ? <span className="text-xs font-medium uppercase tracking-[0.14em] text-primary">{characters.length} character{characters.length === 1 ? '' : 's'}</span> : undefined}
      action={
        <Button onClick={() => setShowCreateDialog(true)} className="glow-primary">
          <Plus className="mr-2 h-4 w-4" />
          New Character
        </Button>
      }
    >

      {/* Character Grid */}
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
        <div className="empty-state min-h-[420px]">
          <div className="mb-5 rounded-lg bg-primary/10 p-5 text-primary ring-1 ring-primary/20">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Create your first character</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Start with a name, a voice, and a first message. The studio will keep their memories, canon, and sessions organized.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="mt-6 glow-primary">
            <Plus className="mr-2 h-4 w-4" />
            Create Character
          </Button>
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
