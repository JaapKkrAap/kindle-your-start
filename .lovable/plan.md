
# Character Memories Integration

## Analyse

### Huidige situatie

| Component | Status |
|-----------|--------|
| `memories` tabel | Bestaat in database met correcte kolommen |
| `Memory` type | Gedefinieerd in `src/types/index.ts` (regel 52-61) |
| Edge function | Ondersteunt `memories?: string[]` parameter (regel 24), verwerkt in `buildSystemPrompt` (regel 88-94) |
| `ChatPage.tsx` | Stuurt lege array: `memories: []` met TODO comment (regel 104) |
| `useMemories` hook | Bestaat niet |

### Database schema (memories tabel)

| Kolom | Type |
|-------|------|
| id | uuid |
| character_id | uuid |
| persona_id | uuid (nullable) |
| category | text |
| content | text |
| importance | integer (default 5) |
| source_message_id | uuid (nullable) |
| created_at | timestamp |

---

## Implementatie

### 1. Nieuwe hook: `src/hooks/useMemories.ts`

Maak een nieuwe hook file met:

```text
useMemories(characterId, personaId?)
  - Query memories tabel
  - Filter op character_id
  - Optioneel filter op persona_id
  - Order by importance DESC
  - Limit 20 (top belangrijkste memories)
  - Return Memory[]

useCreateMemory()
  - Mutation voor nieuwe memory aanmaken
  - Invalidate memories queries
```

**Query:**
```
supabase
  .from('memories')
  .select('*')
  .eq('character_id', characterId)
  .order('importance', { ascending: false })
  .limit(20)
```

---

### 2. ChatPage.tsx wijzigingen

**Imports toevoegen:**
```
import { useMemories } from '@/hooks/useMemories';
```

**Hook aanroepen (na character load):**
```
const { data: memories } = useMemories(characterId, activePersonaId);
```

**In handleSend functie (regel 100-106):**
```
// Verander:
memories: []

// Naar:
memories: memories?.map(m => m.content) ?? []
```

---

### 3. Edge function verificatie

De edge function `supabase/functions/chat/index.ts` is al correct geïmplementeerd:

- Accepteert `memories?: string[]` (regel 24)
- Voegt toe aan system prompt in `buildSystemPrompt`:
```
<character_memory>
You remember the following from past interactions:
1. memory content
2. memory content
</character_memory>
```

Geen wijzigingen nodig aan edge function.

---

## Bestanden

| Bestand | Actie |
|---------|-------|
| `src/hooks/useMemories.ts` | Nieuw bestand aanmaken |
| `src/pages/ChatPage.tsx` | Import hook + gebruik in handleSend |

---

## Technische details

### useMemories hook structuur

```typescript
// Query hook
export function useMemories(characterId?: string, personaId?: string) {
  return useQuery({
    queryKey: ['memories', characterId, personaId],
    queryFn: async (): Promise<Memory[]> => {
      // Build query with character_id filter
      // Optionally filter persona_id if provided
      // Order by importance DESC, limit 20
      // Map database columns to Memory type
    },
    enabled: !!characterId,
  });
}

// Create mutation hook
export function useCreateMemory() {
  // Insert into memories table
  // Invalidate memories queries on success
}
```

### ChatPage integratie

```typescript
// Hook call
const { data: memories } = useMemories(characterId, activePersonaId);

// In sendChatMessage call
const response = await sendChatMessage({
  messages: chatHistory,
  character,
  persona: activePersona,
  memories: memories?.map(m => m.content) ?? [],
  settings: aiSettings,
});
```

---

## Resultaat

Na implementatie:
- Character memories worden automatisch opgehaald bij chat start
- Top 20 belangrijkste memories worden meegestuurd naar de AI
- AI ontvangt memories in `<character_memory>` sectie van system prompt
- Geen wijzigingen nodig aan bestaande edge function
- Klaar voor "Save as Memory" functionaliteit (optionele uitbreiding)
