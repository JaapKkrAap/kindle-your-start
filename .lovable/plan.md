

# Persona Persistence in Chat Sessions

## Overview

This plan implements two improvements to persona handling in chat sessions:

1. **Initialize activePersonaId from session data** - When loading an existing session, the persona selector should reflect the persona that was previously used
2. **Persist persona changes to database** - When the user switches persona mid-session, update the session record so it persists across navigation

## Current Behavior

- `activePersonaId` is initialized as `undefined` (line 78 in ChatPage.tsx)
- When loading an existing session, the persona is not restored from the session's `persona_id` field
- When clicking on a persona in the dropdown (line 568), only the local state updates - nothing is saved to the database

## Implementation Steps

### Step 1: Extend useUpdateSession hook

The current `useUpdateSession` hook (lines 200-215 in useChatSessions.ts) only supports updating the `title` field. We need to extend it to also support updating `persona_id`.

**File: `src/hooks/useChatSessions.ts`**

Modify the mutation function to accept an optional `personaId` parameter:

```typescript
export function useUpdateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, title, personaId }: { 
      id: string; 
      title?: string; 
      personaId?: string | null;
    }): Promise<void> => {
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (personaId !== undefined) updateData.persona_id = personaId;
      
      if (Object.keys(updateData).length === 0) return;
      
      const { error } = await supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}
```

### Step 2: Initialize activePersonaId from session data

When a session is selected (either on initial load or when switching sessions), set `activePersonaId` based on the session's `personaId` field.

**File: `src/pages/ChatPage.tsx`**

Add an effect that watches the selected session and initializes the persona:

```typescript
// Initialize persona from session when session loads/changes
useEffect(() => {
  if (!sessions || !sessionId) return;
  
  const currentSession = sessions.find(s => s.id === sessionId);
  if (currentSession) {
    setActivePersonaId(currentSession.personaId);
  }
}, [sessionId, sessions]);
```

This should be placed after the existing session selection effect (around line 153).

### Step 3: Persist persona changes to database

When the user selects a different persona from the dropdown, update the session record in the database.

**File: `src/pages/ChatPage.tsx`**

Create a handler function for persona changes:

```typescript
const handlePersonaChange = useCallback((personaId: string | undefined) => {
  setActivePersonaId(personaId);
  
  // Persist to database if we have an active session
  if (sessionId) {
    updateSession.mutate({ 
      id: sessionId, 
      personaId: personaId ?? null 
    });
  }
}, [sessionId, updateSession]);
```

Then update the dropdown menu items to use this handler instead of directly calling `setActivePersonaId`:

```typescript
<DropdownMenuItem onClick={() => handlePersonaChange(undefined)}>
  <User className="mr-2 h-4 w-4 text-muted-foreground" />
  No Persona (You)
</DropdownMenuItem>
{personas?.map(persona => (
  <DropdownMenuItem
    key={persona.id}
    onClick={() => handlePersonaChange(persona.id)}
  >
    <User className="mr-2 h-4 w-4" />
    {persona.name}
  </DropdownMenuItem>
))}
```

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useChatSessions.ts` | Extend `useUpdateSession` to accept optional `personaId` parameter |
| `src/pages/ChatPage.tsx` | Add persona initialization effect and persona change handler |

### Database Considerations

- The `chat_sessions` table already has a `persona_id` column (nullable UUID)
- The `useChatSessions` hook already returns `personaId` for each session
- No database migrations are required

### Edge Cases Handled

1. **Session with no persona** - Uses `null` in database, `undefined` in TypeScript
2. **Switching sessions** - Persona resets to the new session's persona
3. **New session creation** - Already passes `personaId` to the create mutation (line 122)

