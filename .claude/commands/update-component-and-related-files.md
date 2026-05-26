---
name: update-component-and-related-files
description: Workflow command scaffold for update-component-and-related-files in kindle-your-start.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /update-component-and-related-files

Use this workflow when working on **update-component-and-related-files** in `kindle-your-start`.

## Goal

Makes coordinated changes to a React component and related hooks, lib, or types files to implement a feature.

## Common Files

- `src/components/chat/*.tsx`
- `src/hooks/*.ts`
- `src/lib/*.ts`
- `src/types/*.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit a component in src/components/chat/
- Edit related files in src/hooks/, src/lib/, or src/types/
- Commit them together

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.