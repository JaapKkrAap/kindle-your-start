

# Add Auto Memory Extraction to ChatPage

## Overview

This plan integrates the `useMemoryExtraction` hook into ChatPage.tsx to automatically extract memories every 6 messages after an AI response.

---

## Changes Required

### File: `src/pages/ChatPage.tsx`

**1. Add Import**

Add the import for the memory extraction hook alongside other hook imports (around line 14):

```typescript
import { useMemoryExtraction } from '@/hooks/useMemoryExtraction';
```

**2. Initialize Hook**

Add the hook call inside the component (around line 87, after other hook calls):

```typescript
const { extractMemories, isExtracting } = useMemoryExtraction();
```

**3. Add Ref to Track Last Extraction**

Add a ref to track the last message ID we extracted from (around line 95, with other refs):

```typescript
const lastExtractionMessageId = useRef<string | null>(null);
```

**4. Create Extraction Trigger Function**

Add a function that checks if extraction should run (every 6 messages) and triggers it. This should be placed near the other handler functions:

```typescript
const maybeExtractMemories = useCallback(async () => {
  if (!sessionId || !character || isExtracting) return;
  
  // Count messages since last extraction (or total if never extracted)
  const messagesSinceExtraction = lastExtractionMessageId.current
    ? messages.filter(m => {
        const lastIdx = messages.findIndex(msg => msg.id === lastExtractionMessageId.current);
        return messages.indexOf(m) > lastIdx;
      }).length
    : messages.length;
  
  // Trigger extraction every 6 messages
  if (messagesSinceExtraction >= 6) {
    const result = await extractMemories(
      sessionId,
      character.id,
      activePersonaId,
      lastExtractionMessageId.current ?? undefined
    );
    
    // Update last extraction point
    if (messages.length > 0) {
      lastExtractionMessageId.current = messages[messages.length - 1].id;
    }
    
    // Optionally show toast on successful extraction
    if (result.extracted > 0) {
      toast({
        title: 'Memories extracted',
        description: `${result.extracted} new ${result.extracted === 1 ? 'memory' : 'memories'} saved.`,
      });
    }
  }
}, [sessionId, character, activePersonaId, messages, extractMemories, isExtracting, toast]);
```

**5. Trigger After AI Response in handleSend**

In the `handleSend` function, after successfully adding the AI response message (around line 225), call the extraction function:

```typescript
// After: await addMessage.mutateAsync({ ... role: 'character' ... });

// Check if we should extract memories (every 6 messages)
maybeExtractMemories();
```

**6. Also Trigger After Regeneration**

In the `handleRegenerate` function, after successfully adding the regenerated response (around line 359), also call extraction:

```typescript
// After: await addMessage.mutateAsync({ ... role: 'character' ... });

// Check if we should extract memories
maybeExtractMemories();
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Line ~14 | Add import for `useMemoryExtraction` |
| Line ~87 | Initialize `extractMemories` and `isExtracting` from hook |
| Line ~95 | Add `lastExtractionMessageId` ref |
| New function | Add `maybeExtractMemories` callback |
| Line ~225 (handleSend) | Call `maybeExtractMemories()` after AI response |
| Line ~359 (handleRegenerate) | Call `maybeExtractMemories()` after regenerated response |

---

## How It Works

1. A ref tracks the last message ID where extraction occurred
2. After each AI response, `maybeExtractMemories` counts messages since last extraction
3. When count reaches 6+, it triggers the `extract-memories` edge function
4. The edge function uses Claude 3 Haiku to analyze the conversation
5. Extracted memories are stored in the database and become available for future responses
6. A toast notification confirms successful extraction
7. The ref updates to prevent duplicate extractions

