
# Canon System Implementation

## Overzicht

Het canon system zorgt ervoor dat belangrijke story events vastgelegd, zichtbaar en herbruikbaar zijn als permanente lore die de AI beïnvloedt.

---

## Huidige Situatie

| Component | Status |
|-----------|--------|
| `canon_events` tabel | Bestaat in database met juiste structuur |
| `CanonEvent` type | Gedefinieerd in `src/types/index.ts` (regel 72-82) |
| `ChatMessageBubble.tsx` | Canon toggle UI bestaat, maar creëert geen canon_event |
| `ChatPage.tsx` | Roept alleen `useToggleCanon` aan (message flag) |
| Edge Function | Canon wordt NIET meegestuurd naar AI |
| `CanonPage.tsx` | Placeholder - toont geen echte data |
| CSS `.canon-marker` | Gouden border styling bestaat al |

---

## Implementatie

### 1. Nieuwe Hook: `src/hooks/useCanonEvents.ts`

```text
Functies:
- useCanonEvents(characterId?) - Fetch canon events
- useCreateCanonEvent() - Create nieuw canon event
- useDeleteCanonEvent() - Delete canon event

Query structuur:
supabase
  .from('canon_events')
  .select('*')
  .order('event_timestamp', { ascending: false })
```

**Optioneel filter op character_id indien gegeven.**

---

### 2. ChatPage.tsx Wijzigingen

**Imports toevoegen:**
```text
import { useCanonEvents, useCreateCanonEvent, useDeleteCanonEvent } from '@/hooks/useCanonEvents';
```

**Hooks initialiseren:**
```text
const { data: canonEvents } = useCanonEvents(characterId);
const createCanonEvent = useCreateCanonEvent();
const deleteCanonEvent = useDeleteCanonEvent();
```

**handleToggleCanon functie uitbreiden:**

```text
const handleToggleCanon = async (id: string, isCanon: boolean) => {
  const message = messages.find(m => m.id === id);
  if (!message) return;

  // Update message flag
  await toggleCanon.mutateAsync({ id, isCanon });

  if (isCanon) {
    // Create canon event
    await createCanonEvent.mutateAsync({
      characterId: character.id,
      personaId: activePersonaId,
      title: message.content.slice(0, 100),
      description: message.content,
      sourceMessageIds: [message.id],
      eventTimestamp: message.createdAt,
    });
  } else {
    // Find and delete linked canon event
    const linkedEvent = canonEvents?.find(e => 
      e.sourceMessageIds.includes(message.id)
    );
    if (linkedEvent) {
      await deleteCanonEvent.mutateAsync(linkedEvent.id);
    }
  }

  toast({...});
};
```

**Canon events meesturen naar AI:**

In handleSend:
```text
// Bestaand:
memories: memories?.map(m => m.content) ?? [],

// Nieuw toevoegen:
canonEvents: canonEvents?.map(e => ({
  title: e.title,
  description: e.description,
})) ?? [],
```

---

### 3. Edge Function Update: `supabase/functions/chat/index.ts`

**A. Extend ChatRequest interface (regel 8-33):**
```text
canonEvents?: { title: string; description: string }[];
```

**B. Update buildSystemPrompt functie (na memories sectie, regel 94):**

```text
// Add canon events if present
if (canonEvents && canonEvents.length > 0) {
  prompt += `\n\n<established_canon>
These are absolute facts in this story. Never contradict them:
${canonEvents.map(e => `- ${e.title}: ${e.description}`).join("\n")}
</established_canon>`;
}
```

---

### 4. lib/ai.ts Update

**A. Extend ChatCompletionParams interface:**
```text
canonEvents?: { title: string; description: string }[];
```

**B. Include in request body:**
```text
canonEvents: params.canonEvents,
```

---

### 5. CanonPage.tsx Volledige Implementatie

**Imports:**
```text
import { useCanonEvents, useDeleteCanonEvent } from '@/hooks/useCanonEvents';
import { useCharacters } from '@/hooks/useCharacters';
```

**Component structuur:**

```text
- Fetch all canon events (geen characterId filter)
- Fetch all characters (voor namen bij events)
- Group events by character
- Timeline weergave met:
  - Character avatar/naam
  - Event title
  - Event description (truncated)
  - Formatted timestamp (date-fns)
  - Delete button
  - Link naar chat/session (indien sourceMessageIds beschikbaar)
```

**Empty state bestaande code behouden voor als er geen events zijn.**

---

## Bestanden Overzicht

| Bestand | Actie |
|---------|-------|
| `src/hooks/useCanonEvents.ts` | Nieuw bestand |
| `src/pages/ChatPage.tsx` | Extend handleToggleCanon + canon naar AI |
| `src/lib/ai.ts` | Voeg canonEvents toe aan interface en body |
| `supabase/functions/chat/index.ts` | Voeg canon toe aan system prompt |
| `src/pages/CanonPage.tsx` | Volledige implementatie met timeline |

---

## Data Flow

```text
1. User markeert message als canon
   |
   +-- toggleCanon.mutate({ is_canon: true })
   +-- createCanonEvent.mutate({...})
   |
2. User stuurt nieuw bericht
   |
   +-- useCanonEvents(characterId) returns events
   +-- sendChatMessage({ canonEvents: [...] })
   |
3. Edge Function ontvangt request
   |
   +-- buildSystemPrompt() adds <established_canon>
   |
4. AI responds with awareness of canon facts
```

---

## UI Styling (reeds aanwezig)

De `.canon-marker` class in `index.css` voegt al een gouden left border toe:

```css
.canon-marker::before {
  background: linear-gradient(180deg, hsl(var(--primary)), hsl(var(--accent)));
}
```

De `BookMarked` icon naast timestamp is ook al geïmplementeerd in ChatMessageBubble.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Canon toggle terwijl geen character geladen | Early return |
| Delete message die canon is | Zou ook canon_event moeten deleten (toekomstige feature) |
| Meerdere messages naar 1 canon event | sourceMessageIds array ondersteunt dit |
| Canon zonder session context | CanonPage toont alle events cross-session |

---

## Verificatie

Na implementatie:
1. Mark een message als canon
2. Controleer dat canon_event in database verschijnt
3. Stuur nieuw bericht
4. Check edge function logs voor `<established_canon>` in system prompt
5. AI moet canon respecteren in antwoord
6. Open /canon pagina - event moet zichtbaar zijn
7. Delete event - controleer dat het weg is
