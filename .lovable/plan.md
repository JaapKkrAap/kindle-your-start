# Relationship & Memory Progression

## Doel
Maak het bestaande relationship-systeem voelbaar in elke message. Nu wordt `trust/affection/tension/respect` wel getoond maar **niet aan de AI gevoed** — dus de character verandert nooit echt. Dit fixen + moods + intimate memory cards toevoegen.

## Wat we bouwen

### 1. Character mood engine
Afgeleid uit relationship state + recente messages. Mogelijke moods:
`affectionate`, `playful`, `needy`, `jealous`, `cold`, `tense`, `protective`, `teasing`, `withdrawn`, `obsessed`, `neutral`.

Regels (voorbeeld):
- high affection + low tension → `affectionate` / `playful`
- high affection + high tension → `jealous` / `needy`
- low trust + tension spike → `cold` / `withdrawn`
- high respect + medium tension → `protective`

Mood wordt opgeslagen op `relationship_states` (nieuwe kolom `current_mood`) en herberekend na elke AI reactie.

### 2. Auto-update relationship state
De bestaande `extract-memories` edge function draait elke 6 messages. We breiden hem uit met een tweede taak: een lichte AI-call die `trust/affection/tension/respect` deltas teruggeeft (-10..+10 per metric) op basis van de laatste turns. Resultaat wordt geclamped 0–100 en opgeslagen.

### 3. Intimate memory cards
Geen nieuwe tabel nodig — bestaande `memories` heeft `category`. We voegen toe: `kink`, `promise`, `secret`, `favorite`. De extractor herkent deze expliciet. In de UI krijgen ze eigen iconen + sectie in `MemoriesPanel`.

### 4. Prompt-injectie (de echte impact)
In `supabase/functions/chat/index.ts` voegen we een `<relationship_state>` blok toe aan de system prompt met:
- Numerieke waarden + huidige mood
- Korte gedragsinstructie per mood ("You are currently jealous: be possessive, suspicious of mentions of others, withhold warmth until reassured")
- Top intimate memories (kinks/promises/secrets) los gemarkeerd als gevoelig

Dit is de hefboom waardoor de character daadwerkelijk anders gaat reageren.

### 5. UI
- **Chat header**: mood badge naast character naam (icoon + label, kleur uit mood)
- **RelationshipDashboard**: huidige mood bovenaan + 1-zinnige beschrijving
- **Milestone toasts**: wanneer een metric door 25/50/75 heen gaat → kleine toast ("Affection rose to 75 — she's getting attached")

## Technical details

### Database migration
```sql
ALTER TABLE public.relationship_states
  ADD COLUMN current_mood text NOT NULL DEFAULT 'neutral',
  ADD COLUMN mood_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN intimacy_level integer NOT NULL DEFAULT 0;

ALTER TABLE public.relationship_states
  ADD CONSTRAINT relationship_states_unique_triple
  UNIQUE (character_id, persona_id, user_id);
```
(De unique constraint is nodig voor de bestaande `upsert onConflict`.)

Geen schema-changes op `memories` — alleen nieuwe category-strings die de extractor mag uitspugen.

### Files
| File | Change |
|---|---|
| `supabase/functions/chat/index.ts` | Accept `relationshipState` + `intimateMemories` in body; inject `<relationship_state>` blok in system prompt met mood-gedragsregels |
| `supabase/functions/extract-memories/index.ts` | Extra call: vraag relationship-deltas + intimate categories; schrijf naar `relationship_states` en `memories` |
| `src/lib/relationship.ts` (nieuw) | `deriveMood(state)` pure functie + mood metadata (icon/color/instruction) |
| `src/hooks/useRelationshipState.ts` | Voeg `current_mood`/`intimacy_level` toe aan type & upsert |
| `src/lib/ai.ts` | Geef `relationshipState` + `intimateMemories` mee aan chat call |
| `src/pages/ChatPage.tsx` | Trek state op; passeer naar `sendChatMessage`; mood badge in header; milestone-detectie voor toasts |
| `src/components/chat/RelationshipDashboard.tsx` | Mood weergave bovenaan |
| `src/components/chat/MemoriesPanel.tsx` | Iconen + groepering voor kink/promise/secret/favorite |
| `src/types/index.ts` | `currentMood`, `intimacyLevel`, nieuwe memory categories |

### Niet in scope (later)
- Multi-character scenes
- AI-generated continuity summaries
- "Continue/escalate/softer" scene-buttons (apart traject)
