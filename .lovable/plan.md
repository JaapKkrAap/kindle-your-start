
# Multi-Session Chat Support

## Overzicht

Chat sessies moeten persistent zijn per character, met de mogelijkheid om te wisselen tussen bestaande sessies of nieuwe aan te maken.

---

## Huidige Problemen

| Probleem | Impact |
|----------|--------|
| ChatPage maakt altijd nieuwe sessie | Data loss, geen persistentie |
| Geen session picker UI | Geen session switching mogelijk |
| Geen useUpdateSession hook | Title kan niet worden geupdate |
| Geen message count in sessies | Geen context voor gebruiker |

---

## Implementatie

### 1. Type Update: `src/types/index.ts`

Extend ChatSession interface met messageCount:

```text
export interface ChatSession {
  id: string;
  characterId: string;
  personaId?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;  // NEW
}
```

---

### 2. Hook Updates: `src/hooks/useChatSessions.ts`

**A. Update useChatSessions query om message count te includen:**

```text
supabase
  .from('chat_sessions')
  .select('*, chat_messages(count)')
  .eq('character_id', characterId)
  .order('updated_at', { ascending: false })
```

Map response om messageCount te extraheren.

**B. Voeg useUpdateSession hook toe:**

```text
export function useUpdateSession() {
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}
```

---

### 3. Nieuw Component: `src/components/chat/SessionPicker.tsx`

**Props:**
- characterId: string
- sessions: ChatSession[]
- currentSessionId: string | null
- onSelectSession: (id: string) => void
- onNewSession: () => void
- isLoading?: boolean

**UI:**
- Dropdown trigger met huidige session titel
- Session items met:
  - Title (truncated)
  - Relative time (date-fns formatDistanceToNow)
  - Message count badge
- Separator
- "New Session" button bovenaan of onderaan

---

### 4. ChatPage.tsx Refactor

**Nieuwe logica:**

```text
// Fetch existing sessions for this character
const { data: sessions, isLoading: loadingSessions } = useChatSessions(characterId);

// Session selection logic
useEffect(() => {
  if (loadingSessions) return;
  
  if (sessions?.length && !sessionId) {
    // Resume most recent session
    setSessionId(sessions[0].id);
  } else if (!sessions?.length && !sessionId) {
    // No sessions exist - create first one
    handleNewSession();
  }
}, [sessions, loadingSessions, sessionId]);

// New session handler
const handleNewSession = async () => {
  if (!character) return;
  const session = await createSession.mutateAsync({
    characterId: character.id,
    personaId: activePersonaId,
    title: `Session with ${character.name}`,
  });
  setSessionId(session.id);
  
  if (character.firstMessage) {
    await addMessage.mutateAsync({
      sessionId: session.id,
      characterId: character.id,
      role: 'character',
      content: character.firstMessage,
    });
  }
};

// Session switch handler
const handleSelectSession = (id: string) => {
  setSessionId(id);
  // Messages will auto-load via useChatMessages hook
};
```

**Auto-title na eerste user message:**

In handleSend, na eerste user message:

```text
// Check if this is the first user message
const isFirstUserMessage = !messages.some(m => m.role === 'user');

if (isFirstUserMessage && sessionId) {
  const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
  updateSession.mutate({ id: sessionId, title });
}
```

**Header SessionPicker toevoegen:**

Naast persona dropdown, voeg SessionPicker toe met sessions data.

---

## Bestanden

| Bestand | Actie |
|---------|-------|
| `src/types/index.ts` | Voeg messageCount toe aan ChatSession |
| `src/hooks/useChatSessions.ts` | Update query + voeg useUpdateSession toe |
| `src/components/chat/SessionPicker.tsx` | Nieuw component |
| `src/pages/ChatPage.tsx` | Refactor session logica + voeg picker toe |

---

## Data Flow

```text
1. ChatPage mount met characterId
   |
2. useChatSessions(characterId) query
   |
   +-- Sessions gevonden?
   |     |
   |     +-- Ja: setSessionId(sessions[0].id)
   |     |       useChatMessages(sessionId) laadt messages
   |     |
   |     +-- Nee: createSession()
   |              addMessage(firstMessage)
   |
3. User verstuurt bericht
   |
   +-- Is eerste user message?
   |     |
   |     +-- Ja: updateSession({ title: content.slice(0,50) })
   |
4. User klikt "New Session"
   |
   +-- createSession()
   +-- setSessionId(newSession.id)
   +-- addMessage(firstMessage)
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Geen sessies voor character | Maak automatisch eerste sessie |
| Session met 0 messages | Toon "Empty" in badge |
| Lange session title | Truncate met ellipsis |
| Session switch tijdens AI response | isTyping state reset |

---

## Verificatie

Na implementatie:
1. Open chat met character
2. Stuur bericht - session title update
3. Maak nieuwe session via picker
4. Switch terug naar oude session - messages intact
5. Refresh pagina - sessie blijft geselecteerd
