
# Improve Roleplay Consistency

## Problem Analysis

The roleplay feels "all over the place" because several key context elements are not being properly integrated:

1. **Relationship State Not Used**: The relationship tracking data (trust, affection, tension, respect) is fetched and sent to the backend, but the edge function completely ignores it - it's not in the validation schema and not in the system prompt.

2. **Missing Continuity Guidelines**: The system prompt lacks explicit rules for maintaining narrative consistency (scene continuity, emotional states, conversation context).

3. **Incomplete User Message Generation**: When generating messages for the user, relationship state and some context is missing.

## Solution

### 1. Add Relationship State to Chat Edge Function

Update `supabase/functions/chat/index.ts`:

- Add `RelationshipStateSchema` to Zod validation
- Include `relationshipState` in `ChatRequestSchema`
- Add relationship context to `buildSystemPrompt()`:

```text
<relationship_dynamics>
Current relationship standing with the user:
- Trust: 75/100 (high confidence, open to vulnerability)
- Affection: 60/100 (warm feelings, comfortable closeness)
- Tension: 30/100 (slight underlying tension)
- Respect: 80/100 (strong esteem)

Let these values naturally influence your character's:
- Openness and vulnerability in dialogue
- Physical proximity and touch descriptions
- Patience and forgiveness
- Willingness to share secrets or personal thoughts
</relationship_dynamics>
```

### 2. Add Narrative Consistency Rules to System Prompt

Enhance the `<guiding_principles>` section with explicit consistency rules:

```text
<narrative_continuity>
- REMEMBER the current scene setting (location, time, atmosphere)
- MAINTAIN emotional states until something changes them
- REFERENCE recent dialogue naturally - don't forget what was just said
- TRACK physical positions - if sitting, stay sitting unless moving
- PRESERVE ongoing tensions or affections from earlier in the conversation
- If unsure of a detail, stay consistent with what you've established
</narrative_continuity>
```

### 3. Add Scene Anchor Instructions

Add dynamic scene anchoring so the AI maintains awareness of the current situation:

```text
<scene_awareness>
When responding:
1. First, internally note: Where are we? What just happened? What's the emotional tone?
2. Then respond in a way that acknowledges and builds on that context
3. Any shifts in location, time, or mood should be explicitly described
</scene_awareness>
```

### 4. Fix User Message Generation

Update `src/pages/ChatPage.tsx` to include `relationshipState` in `handleGenerateUserMessage` and `handleRegenerateUserMessage` function calls.

### 5. Add Temperature Guidance

Lower default temperature from 0.8 to 0.7 for more consistent outputs while maintaining creativity. High temperature (0.8+) can cause erratic behavior.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Add relationship state schema, update system prompt with relationship dynamics and continuity rules |
| `src/pages/ChatPage.tsx` | Include `relationshipState` in user message generation calls |
| `src/hooks/useAISettings.ts` | Lower default temperature to 0.7 |

## Technical Implementation

### Relationship State Integration

```typescript
// Add to ChatRequestSchema in edge function
const RelationshipStateSchema = z.object({
  trust: z.number().min(0).max(100),
  affection: z.number().min(0).max(100),
  tension: z.number().min(0).max(100),
  respect: z.number().min(0).max(100),
}).optional();

const ChatRequestSchema = z.object({
  // ... existing fields
  relationshipState: RelationshipStateSchema,
});
```

### System Prompt Enhancement

The `buildSystemPrompt` function will be extended to:
1. Include relationship dynamics section when `relationshipState` is provided
2. Add narrative continuity rules to prevent context loss
3. Add scene awareness instructions for better grounding

## Expected Outcome

After these changes:
- Character responses will reflect the relationship dynamic (more open when trust is high, more guarded when low)
- Physical and emotional continuity will be maintained across messages
- Scene setting and atmosphere will persist naturally
- User-generated messages will also respect relationship context
- Overall roleplay will feel more grounded and consistent
