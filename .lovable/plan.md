

# Testing the Roleplay Application

To test the app end-to-end, I need to fix several issues and add the ability to manually enter an API key.

---

## Current Issues Found

1. **Chat not connected to AI** - The ChatPage uses a placeholder `setTimeout` instead of calling the actual AI edge function
2. **No API key input** - The settings page tells users to configure the API key in "project secrets" but doesn't provide a way to enter it
3. **Settings sync bug** - Uses `useState` incorrectly for effect logic (should be `useEffect`)

---

## Implementation Plan

### 1. Add OpenRouter API Key Input to Settings

Update the Settings page to include an input field for the OpenRouter API key:
- Add a password input field for entering the API key
- Store the API key in the `ai_settings` table (add column if needed)
- Display masked key with option to reveal/update
- Show connection status indicator

**Database Change:**
```sql
ALTER TABLE ai_settings ADD COLUMN openrouter_api_key TEXT;
```

### 2. Update Edge Function to Accept API Key

Modify the chat edge function to:
- Accept the API key from the request body (fallback to env variable)
- This allows the frontend to pass the user-entered key

### 3. Connect ChatPage to Real AI

Update ChatPage to:
- Fetch AI settings from the database
- Call the `sendChatMessage` function from `src/lib/ai.ts`
- Handle errors and display appropriate messages
- Pass memories from the character's memory store

### 4. Fix Settings Page Sync Bug

Replace incorrect `useState` with proper `useEffect` to sync local state when settings load.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add `openrouter_api_key` column to `ai_settings` |
| `src/types/index.ts` | Add `openrouterApiKey` to `AISettings` type |
| `src/hooks/useAISettings.ts` | Handle new API key field |
| `src/pages/SettingsPage.tsx` | Add API key input, fix useEffect bug |
| `src/pages/ChatPage.tsx` | Connect to real AI via `sendChatMessage` |
| `supabase/functions/chat/index.ts` | Accept API key from request body |
| `src/lib/ai.ts` | Pass API key in request |

---

## Testing Flow After Implementation

1. **Go to Settings** → Enter OpenRouter API key or configure LM Studio endpoint
2. **Go to Characters** → Click "New Character" → Fill in the form → Create
3. **Click "Chat"** on the character card
4. **Send a message** → Character responds via the configured AI provider
5. **Toggle canon** on messages to test memory system

---

## Technical Details

### API Key Storage
The OpenRouter API key will be stored in the database. While this is simpler for a single-user app, it's transmitted to the edge function which uses it server-side - the key is never exposed to the browser.

### Settings Type Update
```typescript
export interface AISettings {
  provider: 'lmstudio' | 'openrouter';
  lmstudioEndpoint: string;
  lmstudioModel: string;
  openrouterModel: string;
  openrouterApiKey?: string; // NEW
  temperature: number;
  maxTokens: number;
  systemPromptOverride?: string;
}
```

### Edge Function Update
```typescript
// Accept API key from request, fallback to env
const openrouterKey = body.openrouterApiKey || Deno.env.get("OPENROUTER_API_KEY");
```

