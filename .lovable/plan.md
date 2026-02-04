

# Add Narrative Directives to ChatPage

## Overview

This plan integrates the `useNarrativeDirectives` hook into ChatPage.tsx to pass story directives to all AI chat calls.

---

## Changes Required

### File: `src/pages/ChatPage.tsx`

**1. Add Import (line 16)**

Add the import for the narrative directives hook:

```typescript
import { useNarrativeDirectives } from '@/hooks/useNarrativeDirectives';
```

**2. Initialize Hook (around line 89, after useMemoryExtraction)**

Add the hook call inside the component:

```typescript
const { getDirectivesForApi } = useNarrativeDirectives(characterId);
```

**3. Update sendChatMessage Call in handleSend (line 246-256)**

Add `narrativeDirectives` to the sendChatMessage call:

```typescript
const response = await sendChatMessage({
  messages: chatHistory,
  character,
  persona: activePersona,
  memories: memories?.map(m => m.content) ?? [],
  canonEvents: canonEvents?.map(e => ({
    title: e.title,
    description: e.description,
  })) ?? [],
  narrativeDirectives: getDirectivesForApi(),
  settings: aiSettings,
});
```

**4. Update sendChatMessage Call in handleRegenerate (line 383-393)**

Add `narrativeDirectives` to the regeneration call:

```typescript
const response = await sendChatMessage({
  messages: chatHistory,
  character,
  persona: activePersona,
  memories: memories?.map(m => m.content) ?? [],
  canonEvents: canonEvents?.map(e => ({
    title: e.title,
    description: e.description,
  })) ?? [],
  narrativeDirectives: getDirectivesForApi(),
  settings: aiSettings,
});
```

**5. Update sendChatMessage Call in handleGenerateUserMessage (line 425-443)**

Add `narrativeDirectives` to the user message generation call:

```typescript
const response = await sendChatMessage({
  messages: [...chatHistory, { role: 'system', content: '...' }],
  character,
  persona: activePersona,
  memories: memories?.map(m => m.content) ?? [],
  canonEvents: canonEvents?.map(e => ({
    title: e.title,
    description: e.description,
  })) ?? [],
  narrativeDirectives: getDirectivesForApi(),
  settings: aiSettings,
});
```

**6. Update sendChatMessage Call in handleRegenerateUserMessage (line 462-482)**

Add `narrativeDirectives` to the user message regeneration call:

```typescript
const response = await sendChatMessage({
  messages: [...chatHistory, { role: 'system', content: '...' }],
  character,
  persona: activePersona,
  memories: memories?.map(m => m.content) ?? [],
  canonEvents: canonEvents?.map(e => ({
    title: e.title,
    description: e.description,
  })) ?? [],
  narrativeDirectives: getDirectivesForApi(),
  settings: aiSettings,
});
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Line 16 | Add import for `useNarrativeDirectives` |
| Line ~89 | Initialize `getDirectivesForApi` from hook |
| Line ~246 | Add `narrativeDirectives` to handleSend |
| Line ~383 | Add `narrativeDirectives` to handleRegenerate |
| Line ~425 | Add `narrativeDirectives` to handleGenerateUserMessage |
| Line ~462 | Add `narrativeDirectives` to handleRegenerateUserMessage |

---

## How It Works

1. The hook manages an in-memory list of narrative directives (goals, reveals, escalations, resolutions)
2. `getDirectivesForApi()` returns the directives in the format expected by the chat edge function
3. All four `sendChatMessage` calls will now include any active directives
4. The chat edge function injects these as hidden `<narrative_objectives>` in the system prompt
5. Characters will naturally weave these story objectives into their responses

