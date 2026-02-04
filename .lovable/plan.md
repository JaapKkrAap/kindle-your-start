
# Character & Persona Edit Fix

## Analyse

De dialog componenten en update hooks zijn al correct geïmplementeerd. Het probleem zit in de **page componenten** die de update hooks niet aanroepen bij het bewerken.

### Huidige situatie

| Component | Status |
|-----------|--------|
| `CharacterFormDialog.tsx` | Werkt correct - toont juiste titel/button, roept `onSubmit` aan |
| `PersonaFormDialog.tsx` | Werkt correct - zelfde patroon |
| `useUpdateCharacter` hook | Al geïmplementeerd (regel 92-117) |
| `useUpdatePersona` hook | Al geïmplementeerd (regel 93-117) |
| `CharactersPage.tsx` | **PROBLEEM** - TODO comment, update wordt niet aangeroepen |
| `PersonasPage.tsx` | **PROBLEEM** - TODO comment, update wordt niet aangeroepen |

---

## Implementatie

### 1. CharactersPage.tsx

**Wijzigingen:**
- Import `useUpdateCharacter` hook
- Initialiseer de mutation
- Pas de edit dialog `onSubmit` aan:

```text
Current (regel 134-138):
onSubmit={async (data) => {
  // TODO: implement update
  setEditingCharacter(null);
}}

New:
onSubmit={async (data) => {
  await updateCharacter.mutateAsync({ id: editingCharacter.id, data });
  setEditingCharacter(null);
  toast({
    title: 'Character updated',
    description: `${data.name} has been updated`,
  });
}}
```

- Voeg `isLoading={updateCharacter.isPending}` toe aan de dialog

---

### 2. PersonasPage.tsx

**Wijzigingen:**
- Import `useUpdatePersona` hook
- Initialiseer de mutation
- Pas de edit dialog `onSubmit` aan (regel 135-139):

```text
Current:
onSubmit={async (data) => {
  // TODO: implement update
  setEditingPersona(null);
}}

New:
onSubmit={async (data) => {
  await updatePersona.mutateAsync({ id: editingPersona.id, data });
  setEditingPersona(null);
  toast({
    title: 'Persona updated',
    description: `${data.name} has been updated`,
  });
}}
```

- Voeg `isLoading={updatePersona.isPending}` toe aan de dialog

---

## Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/CharactersPage.tsx` | Import + gebruik `useUpdateCharacter`, fix edit handler |
| `src/pages/PersonasPage.tsx` | Import + gebruik `useUpdatePersona`, fix edit handler |

---

## Geen wijzigingen nodig

- `CharacterFormDialog.tsx` - al correct
- `PersonaFormDialog.tsx` - al correct
- `useCharacters.ts` - update hook al geïmplementeerd
- `usePersonas.ts` - update hook al geïmplementeerd

---

## Resultaat

Na implementatie:
- Characters kunnen worden bewerkt via dezelfde dialog als create
- Personas kunnen worden bewerkt via dezelfde dialog als create
- Submit button toont loading state tijdens opslaan
- Success toast bevestigt de update
- Data blijft correct na refresh (Supabase persistence)
