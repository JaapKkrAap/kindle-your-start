---
name: update-multiple-react-hooks-together
description: Workflow command scaffold for update-multiple-react-hooks-together in kindle-your-start.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /update-multiple-react-hooks-together

Use this workflow when working on **update-multiple-react-hooks-together** in `kindle-your-start`.

## Goal

Updates several related React hooks in the src/hooks directory, likely to support a new feature or state change.

## Common Files

- `src/hooks/useAISettings.ts`
- `src/hooks/useCharacters.ts`
- `src/hooks/useChatSessions.ts`
- `src/hooks/usePersonas.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit multiple files in src/hooks/ (e.g., useAISettings.ts, useCharacters.ts, useChatSessions.ts, usePersonas.ts)
- Commit them together

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.