

# AI Character Generator

## Overview

Add a "Generate Character" button to the character creation form that uses AI to auto-fill empty fields based on existing input. If everything is empty, the AI asks up to 3 quick questions first via a small inline chat. If some fields are filled, it respects them and generates the rest.

## UX Flow

### Scenario A: All fields empty
1. User clicks "Generate Character" (sparkle icon button at top of form)
2. A small inline panel appears with up to 3 short questions (genre, character type, tone)
3. User answers, clicks "Generate"
4. AI fills all fields automatically

### Scenario B: Some fields filled
1. User has already entered e.g. a name and some traits
2. Clicks "Generate Character"
3. AI reads existing input, generates the remaining fields
4. Existing values are preserved; only empty fields get filled

## Architecture

```text
+---------------------+       +---------------------------+       +------------------+
| CharacterFormDialog |  -->  | generate-character        |  -->  | Lovable AI       |
| (Generate button)   |       | (edge function)           |       | (gemini-2.5-flash)|
+---------------------+       +---------------------------+       +------------------+
```

The edge function uses Lovable AI (no API key needed) via the `LOVABLE_API_KEY` secret, calling `google/gemini-2.5-flash` for fast, cost-efficient generation.

## Implementation Steps

### 1. Create Edge Function: `supabase/functions/generate-character/index.ts`

- Accepts partial character data (any fields that are already filled)
- Accepts optional `preferences` object (genre, character type, tone) for the empty-form scenario
- Uses a structured output prompt that returns JSON matching the form fields
- Returns: `{ name, backstory, personalityTraits, speechStyle, behavioralBoundaries, firstMessage }`

Request body:
```json
{
  "existingData": {
    "name": "Kael",
    "personalityTraits": ["Brave"],
    "backstory": "",
    "speechStyle": "",
    "behavioralBoundaries": "",
    "firstMessage": ""
  },
  "preferences": {
    "genre": "dark fantasy",
    "characterType": "antagonist",
    "tone": "serious"
  }
}
```

### 2. Update `CharacterFormDialog.tsx`

- Add a "Generate" button (Sparkles icon) next to the dialog title
- When clicked with all-empty fields: show a small preferences panel with 3 dropdowns (genre, type, tone) before generating
- When clicked with some filled fields: generate immediately
- On response: programmatically set form values via `setValue()` and update `traits` state
- Show loading state on the button during generation

### 3. Update `supabase/config.toml`

- Add `verify_jwt = false` for the new function (auth validated in code)

## Technical Details

### Edge Function Prompt Strategy

The prompt instructs the AI to:
- Treat any non-empty fields as immutable constraints
- Generate missing fields that are coherent with existing ones
- Return valid JSON only, no markdown wrapping
- Keep backstory to 1-2 paragraphs
- Generate 4-6 personality traits (preserving existing ones)
- Write first message fully in-character

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-character/index.ts` | Create | Edge function for AI character generation |
| `src/components/characters/CharacterFormDialog.tsx` | Modify | Add Generate button, preferences panel, and auto-fill logic |

### UI Details

- Generate button: positioned in the dialog header, uses `Sparkles` icon from lucide-react
- Preferences panel: 3 select dropdowns that appear inline at the top of the form when all fields are empty
  - Genre: Fantasy, Sci-Fi, Modern, Historical, Horror, Romance, Other
  - Character Type: Protagonist, Antagonist, Mentor, Companion, Trickster, Stranger
  - Tone: Serious, Playful, Dark, Romantic, Mysterious, Warm
- Loading state: button shows spinner, form fields show subtle shimmer

