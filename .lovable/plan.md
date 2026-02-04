

# Implement Edit, Regenerate & Fix Character Editing

## Overview

This plan implements three features:
1. **Message Edit** - Edit chat messages inline with a dialog
2. **Message Regenerate** - Re-generate AI responses from a specific point
3. **Fix Character Editing** - Resolve issues preventing character edits

---

## Part 1: Message Edit Functionality

### What It Does
Allows users to edit any message in the chat. When edited:
- The message content updates in the database
- An `edited_at` timestamp is set
- The "(edited)" label appears on the message

### Implementation

**File: `src/pages/ChatPage.tsx`**

Add state for editing:
```typescript
const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
const [editContent, setEditContent] = useState('');
```

Update `handleEdit`:
```typescript
const handleEdit = (id: string) => {
  const message = messages.find(m => m.id === id);
  if (message) {
    setEditingMessageId(id);
    setEditContent(message.content);
  }
};
```

Add save handler:
```typescript
const handleSaveEdit = async () => {
  if (!editingMessageId) return;
  
  try {
    await updateMessage.mutateAsync({ 
      id: editingMessageId, 
      content: editContent 
    });
    setEditingMessageId(null);
    setEditContent('');
    toast({
      title: 'Message updated',
      description: 'Your edit has been saved.',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to update message',
      variant: 'destructive',
      action: <ToastAction altText="Retry" onClick={handleSaveEdit}>Retry</ToastAction>,
    });
  }
};
```

Add import:
```typescript
import { useUpdateMessage } from '@/hooks/useChatSessions';
```

Add Edit Dialog UI (before closing `</div>` of main component):
```typescript
<Dialog open={!!editingMessageId} onOpenChange={() => setEditingMessageId(null)}>
  <DialogContent className="glass-card max-w-2xl">
    <DialogHeader>
      <DialogTitle>Edit Message</DialogTitle>
    </DialogHeader>
    <Textarea
      value={editContent}
      onChange={(e) => setEditContent(e.target.value)}
      className="min-h-[150px] bg-muted/50"
      placeholder="Edit your message..."
    />
    <DialogFooter>
      <Button variant="ghost" onClick={() => setEditingMessageId(null)}>
        Cancel
      </Button>
      <Button onClick={handleSaveEdit} disabled={updateMessage.isPending}>
        {updateMessage.isPending ? 'Saving...' : 'Save'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Part 2: Message Regenerate Functionality

### What It Does
When the user clicks "Regenerate" on a character message:
1. Delete that message and all messages after it
2. Re-send the conversation to the AI
3. Get a new response

### Implementation

**File: `src/hooks/useChatSessions.ts`**

Add a hook to delete messages after a certain point:
```typescript
export function useDeleteMessagesAfter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, afterTimestamp }: { 
      sessionId: string; 
      afterTimestamp: Date 
    }): Promise<void> => {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId)
        .gte('created_at', afterTimestamp.toISOString());
      
      if (error) throw error;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    },
  });
}
```

**File: `src/pages/ChatPage.tsx`**

Import new hook:
```typescript
import { useDeleteMessagesAfter } from '@/hooks/useChatSessions';
```

Add hook instance:
```typescript
const deleteMessagesAfter = useDeleteMessagesAfter();
```

Update `handleRegenerate`:
```typescript
const handleRegenerate = async (id: string) => {
  if (!sessionId || !character || !aiSettings) return;
  
  const messageIndex = messages.findIndex(m => m.id === id);
  if (messageIndex === -1) return;
  
  const targetMessage = messages[messageIndex];
  
  // Delete this message and everything after it
  await deleteMessagesAfter.mutateAsync({
    sessionId,
    afterTimestamp: targetMessage.createdAt,
  });
  
  // Get conversation up to (but not including) the deleted message
  const previousMessages = messages.slice(0, messageIndex);
  
  // Build chat history
  const chatHistory = previousMessages.map(m => ({
    role: m.role,
    content: m.content,
  }));
  
  setIsTyping(true);
  
  try {
    const response = await sendChatMessage({
      messages: chatHistory,
      character,
      persona: activePersona,
      memories: memories?.map(m => m.content) ?? [],
      canonEvents: canonEvents?.map(e => ({
        title: e.title,
        description: e.description,
      })) ?? [],
      settings: aiSettings,
    });
    
    await addMessage.mutateAsync({
      sessionId,
      characterId: character.id,
      personaId: activePersonaId,
      role: 'character',
      content: response.content,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate';
    toast({
      title: 'Regeneration failed',
      description: errorMessage,
      variant: 'destructive',
      action: <ToastAction altText="Retry" onClick={() => handleRegenerate(id)}>Retry</ToastAction>,
    });
  } finally {
    setIsTyping(false);
  }
};
```

---

## Part 3: Fix Character Editing

### Problem Analysis
The character edit dialog appears to be implemented correctly in `CharactersPage.tsx`. The issue is likely in the dropdown menu behavior - clicking "Edit" may trigger a page navigation due to the Play button overlay covering the dropdown.

### Solution
The CharacterCard has a Play button overlay that covers the entire card (`<button className="absolute inset-0">`) which might be capturing clicks before they reach the dropdown menu.

**File: `src/components/characters/CharacterCard.tsx`**

Change the Play button overlay to exclude the dropdown area:
```typescript
{/* Play button overlay - exclude top-right dropdown area */}
<button
  onClick={() => onPlay(character)}
  className="absolute inset-0 top-10 flex items-center justify-center bg-primary/0 opacity-0 transition-all group-hover:bg-primary/10 group-hover:opacity-100"
>
  ...
</button>
```

Additionally, ensure the dropdown menu has proper z-index:
```typescript
<div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
```

Also add `stopPropagation` to dropdown items:
```typescript
<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(character); }}>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ChatPage.tsx` | Add edit dialog, update handlers, add imports |
| `src/hooks/useChatSessions.ts` | Add `useDeleteMessagesAfter` hook |
| `src/components/characters/CharacterCard.tsx` | Fix click event propagation |

---

## New Imports for ChatPage.tsx

```typescript
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
```

---

## User Flow: Edit Message

1. User hovers over any message
2. Clicks "Edit" button
3. Dialog opens with current message content
4. User edits text
5. Clicks "Save"
6. Message updates in database
7. UI shows "(edited)" label

## User Flow: Regenerate

1. User hovers over character message
2. Clicks "Regenerate" button
3. System deletes that message and any after it
4. Loading indicator appears
5. AI generates new response
6. New message appears

## User Flow: Edit Character

1. User hovers over character card
2. Clicks three-dot menu
3. Clicks "Edit"
4. Dialog opens with character details
5. User makes changes
6. Clicks "Save Changes"
7. Character updates

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Edit empty message | Prevent save if content is empty |
| Regenerate while typing | Disable button during AI generation |
| Network error during edit | Toast with retry action |
| Delete last message | Regenerate still works (empty history) |

