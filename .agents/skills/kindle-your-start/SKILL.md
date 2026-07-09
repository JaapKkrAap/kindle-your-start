```markdown
# kindle-your-start Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns and workflows for the `kindle-your-start` TypeScript codebase. You'll learn how to follow the project's coding conventions, coordinate multi-file updates, keep Supabase types and migrations in sync, manage React hooks and components, update Supabase edge functions, and maintain TypeScript configuration files. This guide also covers the project's testing patterns and provides handy `/commands` for common workflows.

## Coding Conventions

- **Language:** TypeScript
- **Framework:** None detected (React patterns present)
- **File Naming:** Use `camelCase` for file names.
  - Example: `useChatSessions.ts`, `aiSettings.ts`
- **Imports:** Use alias imports.
  - Example:
    ```typescript
    import { fetchChats } from '@/lib/chatApi'
    ```
- **Exports:** Prefer named exports.
  - Example:
    ```typescript
    export function useAISettings() { ... }
    ```
- **Commit Messages:** Freeform, usually short (~9 characters on average).

## Workflows

### Update Supabase Types and Migrations
**Trigger:** When you need to add or modify a database table/column in Supabase.  
**Command:** `/new-table`

1. Edit `src/integrations/supabase/types.ts` to update or add TypeScript types.
2. Generate a new migration SQL file in `supabase/migrations/`.
3. Commit both files together.

**Example:**
```typescript
// src/integrations/supabase/types.ts
export type Book = {
  id: string
  title: string
  author: string
  publishedAt: string
}
```
```sql
-- supabase/migrations/20240601_add_books_table.sql
CREATE TABLE books (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  author text,
  published_at date
);
```

---

### Update Multiple React Hooks Together
**Trigger:** When you want to add or modify cross-cutting state logic or feature support in hooks.  
**Command:** `/update-hooks`

1. Edit multiple files in `src/hooks/` (e.g., `useAISettings.ts`, `useCharacters.ts`, `useChatSessions.ts`, `usePersonas.ts`).
2. Commit them together.

**Example:**
```typescript
// src/hooks/useAISettings.ts
export function useAISettings() { ... }

// src/hooks/useCharacters.ts
export function useCharacters() { ... }
```

---

### Update Component and Related Files
**Trigger:** When you want to add or update a feature in a component that also requires logic or type changes.  
**Command:** `/update-component`

1. Edit a component in `src/components/chat/` (e.g., `ChatWindow.tsx`).
2. Edit related files in `src/hooks/`, `src/lib/`, or `src/types/`.
3. Commit them together.

**Example:**
```tsx
// src/components/chat/ChatWindow.tsx
import { useChatSessions } from '@/hooks/useChatSessions'
...
```
```typescript
// src/hooks/useChatSessions.ts
export function useChatSessions() { ... }
```

---

### Update Supabase Function
**Trigger:** When you want to change server-side logic for chat or memory extraction.  
**Command:** `/update-function`

1. Edit `supabase/functions/<function>/index.ts` (e.g., `chat` or `extract-memories`).
2. Optionally edit related `src/lib/*.ts` files.
3. Commit them together.

**Example:**
```typescript
// supabase/functions/chat/index.ts
import { processChat } from '@/lib/ai'
...
```
```typescript
// src/lib/ai.ts
export function processChat(input: string) { ... }
```

---

### Update tsconfig Files Together
**Trigger:** When you want to change TypeScript compiler options or paths.  
**Command:** `/update-tsconfig`

1. Edit `tsconfig.app.json`.
2. Edit `tsconfig.json`.
3. Commit them together.

**Example:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```
```json
// tsconfig.app.json
{
  "extends": "./tsconfig.json",
  "include": ["src"]
}
```

---

## Testing Patterns

- **Framework:** Unknown (not detected)
- **Test File Pattern:** Files are named with the pattern `*.test.*`
  - Example: `useChatSessions.test.ts`
- **Location:** Typically alongside source files or in the same directory.

**Example:**
```typescript
// src/hooks/useChatSessions.test.ts
import { useChatSessions } from './useChatSessions'

test('returns initial chat sessions', () => {
  // test logic here
})
```

## Commands

| Command            | Purpose                                                        |
|--------------------|----------------------------------------------------------------|
| /new-table         | Update Supabase types and generate a migration together        |
| /update-hooks      | Update multiple related React hooks in one commit              |
| /update-component  | Update a component and its related hooks/lib/types together    |
| /update-function   | Update a Supabase edge function and related library code       |
| /update-tsconfig   | Synchronize changes to tsconfig.app.json and tsconfig.json     |
```
