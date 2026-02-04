

# Memory System & Narrative Directives Integration

## Overview

This plan integrates AI-powered memory extraction and narrative directive systems into your roleplay app. These features will enable characters to automatically remember important information from conversations and allow you to guide story direction through narrative objectives.

## What You'll Get

| Feature | Description |
|---------|-------------|
| **Auto Memory Extraction** | AI analyzes conversations and extracts facts, preferences, relationships, events, emotions, and goals |
| **Narrative Directives** | Set story objectives (build tension, reveal secrets, resolve arcs) that influence character responses |
| **Enhanced System Prompts** | Characters actively drive stories forward and use memories naturally in dialogue |
| **Expanded Memory Categories** | New categories: fact, preference, emotion, goal (in addition to existing ones) |

---

## Part 1: Create Extract-Memories Edge Function

### New File: `supabase/functions/extract-memories/index.ts`

A new backend function that:
- Fetches recent messages from a chat session
- Uses Claude 3 Haiku (fast/cheap) to analyze conversation
- Extracts memories across 6 categories with importance ratings
- Filters duplicates and low-importance items (below 5/10)
- Stores new memories in the database

**Key Features:**
- Incremental extraction (only process messages after a given ID)
- Duplicate detection using existing memory content
- JSON response parsing with markdown code block handling
- Importance threshold filtering (5+)

---

## Part 2: Create Memory Extraction Hook

### New File: `src/hooks/useMemoryExtraction.ts`

A React hook to trigger memory extraction from the UI:

```text
useMemoryExtraction()
  |-- extractMemories(sessionId, characterId, personaId?, afterMessageId?)
  |-- isExtracting: boolean
  |-- lastResult: { extracted: number, memories: Memory[] }
```

This calls the extract-memories edge function and returns the results.

---

## Part 3: Create Narrative Directives Hook

### New File: `src/hooks/useNarrativeDirectives.ts`

A state management hook for narrative objectives:

**Directive Types:**
- `goal` - Character pursues a motivation
- `reveal` - Work toward revealing a secret
- `escalate` - Build tension or create conflict
- `resolve` - Bring closure to story threads

**Pre-built Templates:**
- Build Tension
- Reveal Secret
- Pursue Goal
- Create Conflict
- Deepen Relationship
- Resolve Arc

**API:**
```text
useNarrativeDirectives(characterId?)
  |-- directives: NarrativeDirective[]
  |-- addDirective(directive)
  |-- addFromTemplate('buildTension' | 'revealSecret' | ...)
  |-- removeDirective(id)
  |-- clearDirectives()
  |-- updatePriority(id, priority)
  |-- getDirectivesForApi()
```

---

## Part 4: Update Types

### File: `src/types/index.ts`

**Expand MemoryCategory:**
```text
Current: 'event' | 'relationship' | 'location' | 'item' | 'persona_impression' | 'emotional_shift'

New:     'fact' | 'preference' | 'relationship' | 'event' | 'emotion' | 'goal' | 'location' | 'item' | 'persona_impression' | 'emotional_shift'
```

**Add NarrativeDirective interface:**
```text
NarrativeDirective {
  id: string
  characterId: string
  type: 'goal' | 'reveal' | 'escalate' | 'resolve'
  description: string
  triggerCondition?: string
  priority: number (1-10)
  isActive: boolean
  createdAt: Date
}
```

---

## Part 5: Update AI Integration

### File: `src/lib/ai.ts`

Add `narrativeDirectives` to the chat API call:

```text
ChatCompletionParams {
  ...existing fields
  + narrativeDirectives?: { type, description, priority }[]
}
```

Pass directives to the edge function alongside memories and canon events.

---

## Part 6: Update Chat Edge Function

### File: `supabase/functions/chat/index.ts`

**Schema Updates:**
- Add `NarrativeDirectiveSchema` validation
- Add `narrativeDirectives` to `ChatRequestSchema`

**System Prompt Enhancements:**

1. **Narrative Agency Section** - Instructions for the character to actively drive the story:
   - Introduce complications and surprises
   - Reference memories naturally
   - Have opinions and pursue goals
   - Create dramatic tension

2. **Narrative Objectives Section** - When directives are provided:
   ```text
   <narrative_objectives>
   - [ESCALATE] Build tension gradually... (priority: 7/10)
   - [REVEAL] Work toward revealing a secret... (priority: 8/10)
   </narrative_objectives>
   ```

3. **Enhanced Guiding Principles:**
   - "ACTIVELY DRIVE THE STORY FORWARD"
   - "End responses in ways that invite continuation"

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/extract-memories/index.ts` | Create | AI memory extraction edge function |
| `src/hooks/useMemoryExtraction.ts` | Create | Hook to trigger extraction |
| `src/hooks/useNarrativeDirectives.ts` | Create | Directive state management |
| `src/types/index.ts` | Update | Add types and expand MemoryCategory |
| `src/lib/ai.ts` | Update | Add narrativeDirectives to API |
| `supabase/functions/chat/index.ts` | Update | Enhanced prompts + directive handling |

---

## Technical Notes

### Database Compatibility
The existing `memories` table uses `text` for the category column, so the new categories (fact, preference, emotion, goal) will work without schema changes.

### Edge Function Config
The new `extract-memories` function will need to be added to `supabase/config.toml`:
```toml
[functions.extract-memories]
verify_jwt = false
```

### Security
- Both edge functions validate JWT tokens
- Memory extraction uses authenticated Supabase client
- User can only extract memories from their own sessions (RLS enforced)

---

## Implementation Order

1. Update `src/types/index.ts` (add types)
2. Create `src/hooks/useNarrativeDirectives.ts`
3. Create `src/hooks/useMemoryExtraction.ts`
4. Update `src/lib/ai.ts` (add narrativeDirectives param)
5. Update `supabase/functions/chat/index.ts` (enhanced prompts)
6. Create `supabase/functions/extract-memories/index.ts`
7. Deploy edge functions

