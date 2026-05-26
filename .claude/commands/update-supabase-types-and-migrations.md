---
name: update-supabase-types-and-migrations
description: Workflow command scaffold for update-supabase-types-and-migrations in kindle-your-start.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /update-supabase-types-and-migrations

Use this workflow when working on **update-supabase-types-and-migrations** in `kindle-your-start`.

## Goal

Keeps Supabase types and database schema in sync by updating types and generating a migration file together.

## Common Files

- `src/integrations/supabase/types.ts`
- `supabase/migrations/*.sql`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit src/integrations/supabase/types.ts to update/add types
- Generate a new migration SQL file in supabase/migrations/
- Commit both files together

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.