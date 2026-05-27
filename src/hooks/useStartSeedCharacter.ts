import { useNavigate } from 'react-router-dom';
import { useCharacters, useCreateCharacter } from '@/hooks/useCharacters';
import { useToast } from '@/hooks/use-toast';
import {
  getSeedCharacterMap,
  seedCharacterToFormData,
  setSeedCharacterMap,
  setSeedCharacterRating,
} from '@/data/seedCharacters';
import type { SeedCharacterTemplate } from '@/types';

export function useStartSeedCharacter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: characters } = useCharacters();
  const createCharacter = useCreateCharacter();

  const startSeedCharacter = async (seed: SeedCharacterTemplate) => {
    try {
      const seedMap = getSeedCharacterMap();
      const existingId = seedMap[seed.templateId];
      const existing = existingId ? characters?.find(character => character.id === existingId) : undefined;

      if (existing) {
        navigate(`/chat/${existing.id}`);
        return existing;
      }

      const created = await createCharacter.mutateAsync(seedCharacterToFormData(seed));
      setSeedCharacterMap({ ...seedMap, [seed.templateId]: created.id });
      setSeedCharacterRating(created.id, seed.contentRating);
      navigate(`/chat/${created.id}`);
      return created;
    } catch (error) {
      toast({
        title: 'Could not start scene',
        description: error instanceof Error ? error.message : 'The starter character could not be copied.',
        variant: 'destructive',
      });
      return undefined;
    }
  };

  return {
    startSeedCharacter,
    isStartingSeedCharacter: createCharacter.isPending,
  };
}
