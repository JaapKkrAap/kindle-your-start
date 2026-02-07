

# Fix: User Message Generation Responds as Bot

## Problem

When using "Generate for me" or "Redo last message" with custom instructions, the AI responds from the **character's perspective** instead of the **user/persona's perspective**.

This happens because both `handleGenerateUserMessage` and `handleRegenerateUserMessage` call `sendChatMessage()`, which invokes the `chat` edge function. That function always builds the full character system prompt ("You are [character name]..."), which overrides the inline instruction asking for a user-perspective response.

## Root Cause

In `src/pages/ChatPage.tsx`, the generation functions pass a `system` message saying "generate a response from the user," but the `chat` edge function prepends a much larger system prompt that says "You exist only as [character]. Always remain in character." The character identity prompt dominates.

## Solution

Add a `mode` parameter to the chat edge function that switches the system prompt for user-generation requests. When `mode: 'generate_user_message'`, the function will use a lightweight prompt focused on writing from the user/persona perspective instead of the character's roleplay prompt.

### Changes

**1. Edge Function: `supabase/functions/chat/index.ts`**

- Add `mode` field to the request schema: `z.enum(["roleplay", "generate_user_message"]).default("roleplay")`
- When `mode === "generate_user_message"`, skip the character roleplay system prompt entirely and use a simple utility prompt instead:

```
You are a writing assistant. Generate a message from the USER's perspective
(first person). You are NOT the character. You are helping the user write
their next message in a roleplay conversation.
```

- Include persona details so the AI knows the user's voice/style
- Include conversation history for context

**2. Frontend: `src/lib/ai.ts`**

- Add optional `mode` field to `ChatCompletionParams`
- Pass it through in the request body

**3. Frontend: `src/pages/ChatPage.tsx`**

- In `handleGenerateUserMessage`: pass `mode: 'generate_user_message'` and remove the inline system message hack
- In `handleRegenerateUserMessage`: pass `mode: 'generate_user_message'` and move the instruction/context into a dedicated field instead of injecting it as a system message

### Technical Details

**Edge function system prompt for `generate_user_message` mode:**

```text
You are a writing assistant helping a user craft their next message in a
roleplay conversation. Write from the FIRST PERSON perspective of the user.

You are NOT the character "{characterName}". Do NOT write as them.
Do NOT include actions or dialogue from {characterName}.

{If persona exists:}
The user is roleplaying as: {persona.name}
Their personality: {persona traits}
Their speech style: {persona.speechStyle}
Their tone: {persona.defaultTone}

{If instruction exists:}
Follow this guidance: {instruction}

Output ONLY the message text. No quotes, no meta-commentary.
```

**Request schema update:**

```typescript
// Added to ChatRequestSchema
mode: z.enum(["roleplay", "generate_user_message"]).default("roleplay"),
userInstruction: z.string().max(500).optional(),
```

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Add `mode` field, build alternate system prompt for user generation |
| `src/lib/ai.ts` | Add `mode` and `userInstruction` to params and request body |
| `src/pages/ChatPage.tsx` | Pass `mode: 'generate_user_message'` in both generate functions, clean up inline system messages |

