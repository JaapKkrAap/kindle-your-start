import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CharacterCard } from '@/components/characters/CharacterCard';
import { CharacterFormDialog } from '@/components/characters/CharacterFormDialog';
import { useCharacters, useCreateCharacter, useDeleteCharacter } from '@/hooks/useCharacters';
import { useToast } from '@/hooks/use-toast';
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
      });
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Characters
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your collection of roleplay characters
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="glow-primary">
          <Plus className="mr-2 h-4 w-4" />
          New Character
        </Button>
      </div>

      {/* Character Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : characters && characters.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-6">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold">No characters yet</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Create your first character to begin your roleplay journey.
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
            // TODO: implement update
            setEditingCharacter(null);
          }}
          initialData={editingCharacter}
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
    </div>
  );
}
