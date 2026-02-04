import { useState } from 'react';
import { Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonaCard } from '@/components/personas/PersonaCard';
import { PersonaFormDialog } from '@/components/personas/PersonaFormDialog';
import { usePersonas, useCreatePersona, useUpdatePersona, useDeletePersona } from '@/hooks/usePersonas';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import type { UserPersona, UserPersonaFormData } from '@/types';
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

export default function PersonasPage() {
  const { toast } = useToast();
  const { data: personas, isLoading } = usePersonas();
  const createPersona = useCreatePersona();
  const updatePersona = useUpdatePersona();
  const deletePersona = useDeletePersona();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPersona, setEditingPersona] = useState<UserPersona | null>(null);
  const [deletingPersona, setDeletingPersona] = useState<UserPersona | null>(null);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

  const handleCreate = async (data: UserPersonaFormData) => {
    try {
      const created = await createPersona.mutateAsync(data);
      setShowCreateDialog(false);
      toast({
        title: 'Persona created',
        description: `${created.name} is ready to use!`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create persona',
        variant: 'destructive',
        action: (
          <ToastAction altText="Retry" onClick={() => handleCreate(data)}>
            Retry
          </ToastAction>
        ),
      });
    }
  };

  const handleSelect = (persona: UserPersona) => {
    setActivePersonaId(persona.id);
    toast({
      title: 'Persona selected',
      description: `You are now ${persona.name}`,
    });
  };

  const handleEdit = (persona: UserPersona) => {
    setEditingPersona(persona);
  };

  const handleDelete = async () => {
    if (!deletingPersona) return;
    try {
      await deletePersona.mutateAsync(deletingPersona.id);
      if (activePersonaId === deletingPersona.id) {
        setActivePersonaId(null);
      }
      setDeletingPersona(null);
      toast({
        title: 'Persona deleted',
        description: `${deletingPersona.name} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete persona',
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
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            User Personas
          </h1>
          <p className="mt-1 text-muted-foreground">
            Define how you appear in roleplay sessions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-accent hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          New Persona
        </Button>
      </div>

      {/* Personas List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : personas && personas.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {personas.map(persona => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isActive={activePersonaId === persona.id}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={setDeletingPersona}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-6">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold">No personas yet</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Create personas to define different roleplay identities for yourself.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="mt-6 bg-accent hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Persona
          </Button>
        </div>
      )}

      {/* Info Card */}
      {personas && personas.length > 0 && (
        <div className="mt-8 rounded-xl border border-border/50 bg-muted/20 p-6">
          <h3 className="font-display font-semibold mb-2">How Personas Work</h3>
          <p className="text-sm text-muted-foreground">
            When you select a persona and start chatting with a character, the AI will adapt its
            responses based on your persona's traits, tone, and relationship dynamics. You can switch
            personas mid-conversation to change how you're perceived in the narrative.
          </p>
        </div>
      )}

      {/* Create Dialog */}
      <PersonaFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        isLoading={createPersona.isPending}
      />

      {/* Edit Dialog */}
      {editingPersona && (
        <PersonaFormDialog
          open={!!editingPersona}
          onOpenChange={() => setEditingPersona(null)}
          onSubmit={async (data) => {
            try {
              await updatePersona.mutateAsync({ id: editingPersona.id, data });
              setEditingPersona(null);
              toast({
                title: 'Persona updated',
                description: `${data.name} has been updated`,
              });
            } catch (error) {
              toast({
                title: 'Error',
                description: 'Failed to update persona',
                variant: 'destructive',
                action: (
                  <ToastAction altText="Retry" onClick={() => updatePersona.mutate({ id: editingPersona.id, data })}>
                    Retry
                  </ToastAction>
                ),
              });
            }
          }}
          initialData={editingPersona}
          isLoading={updatePersona.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPersona} onOpenChange={() => setDeletingPersona(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingPersona?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this persona.
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
