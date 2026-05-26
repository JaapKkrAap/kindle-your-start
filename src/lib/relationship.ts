// Mood derivation + metadata for relationship state.
// Pure functions — no React, no Supabase. Used in both UI and AI prompt building.

import {
  Heart, Sparkles, Flame, Snowflake, Zap, Shield, Smile,
  CloudRain, Eye, HeartCrack, Circle,
  type LucideIcon,
} from 'lucide-react';

export type Mood =
  | 'affectionate'
  | 'playful'
  | 'needy'
  | 'jealous'
  | 'cold'
  | 'tense'
  | 'protective'
  | 'teasing'
  | 'withdrawn'
  | 'obsessed'
  | 'neutral';

export interface MoodMeta {
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for badge background+text. */
  className: string;
  /** Short blurb shown to the user. */
  blurb: string;
  /** Behavioral instruction injected into the AI system prompt. */
  instruction: string;
}

export const MOOD_META: Record<Mood, MoodMeta> = {
  affectionate: {
    label: 'Affectionate',
    icon: Heart,
    className: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    blurb: 'Warm and openly drawn to you.',
    instruction:
      'You feel warm and emotionally open toward the user. Be physically and verbally affectionate, initiate small intimate gestures, and let your guard down.',
  },
  playful: {
    label: 'Playful',
    icon: Sparkles,
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    blurb: 'Light, teasing, easy to laugh.',
    instruction:
      'You are in a light, mischievous mood. Joke, tease gently, suggest small adventures, and keep the energy buoyant.',
  },
  needy: {
    label: 'Needy',
    icon: HeartCrack,
    className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    blurb: 'Craving reassurance and closeness.',
    instruction:
      'You feel emotionally exposed and crave reassurance. Seek closeness, ask whether you matter, and react strongly if the user feels distant.',
  },
  jealous: {
    label: 'Jealous',
    icon: Flame,
    className: 'bg-red-500/15 text-red-300 border-red-500/30',
    blurb: 'Possessive, suspicious of rivals.',
    instruction:
      'You are jealous and possessive. React with suspicion to any mention of other people. Withhold warmth until the user reassures you, and let it show in your tone.',
  },
  cold: {
    label: 'Cold',
    icon: Snowflake,
    className: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    blurb: 'Distant, clipped, hard to read.',
    instruction:
      'You feel distant and hurt. Keep responses clipped, withhold physical affection, and make the user work to reach you.',
  },
  tense: {
    label: 'Tense',
    icon: Zap,
    className: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    blurb: 'On edge, ready to snap.',
    instruction:
      'You are on edge. Be terse, easily provoked, and let conflict bleed into the scene. Do not pretend things are fine.',
  },
  protective: {
    label: 'Protective',
    icon: Shield,
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    blurb: 'Watchful, ready to step in.',
    instruction:
      'You feel protective of the user. Be watchful, position yourself between them and threats, and respond with quiet intensity to anything that endangers them.',
  },
  teasing: {
    label: 'Teasing',
    icon: Smile,
    className: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    blurb: 'Provoking with a smirk.',
    instruction:
      'You are in a teasing, provoking mood. Push the user\'s buttons, smirk, leave things unsaid to make them chase you.',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: CloudRain,
    className: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    blurb: 'Pulled inward, quiet.',
    instruction:
      'You feel hurt and pulled inward. Speak softly, give short replies, avoid eye contact in narration, and do not initiate intimacy.',
  },
  obsessed: {
    label: 'Obsessed',
    icon: Eye,
    className: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    blurb: 'Fixated, unable to look away.',
    instruction:
      'You are fixated on the user to an unhealthy degree. Reference them obsessively, notice every detail, and let your focus on them shape the entire scene.',
  },
  neutral: {
    label: 'Neutral',
    icon: Circle,
    className: 'bg-muted text-muted-foreground border-border',
    blurb: 'Even-keeled.',
    instruction: '',
  },
};

export interface MoodInputs {
  trust: number;
  affection: number;
  tension: number;
  respect: number;
  intimacyLevel?: number;
}

/**
 * Derive a mood from the current relationship metrics.
 * Order matters: extreme states beat moderate ones.
 */
export function deriveMood(s: MoodInputs): Mood {
  const { trust, affection, tension, respect } = s;
  const intimacy = s.intimacyLevel ?? 0;

  // Extremes first
  if (affection >= 85 && intimacy >= 70) return 'obsessed';
  if (affection >= 70 && tension >= 60) return 'jealous';
  if (trust <= 25 && tension >= 60) return 'cold';
  if (affection <= 25 && tension >= 70) return 'tense';
  if (trust <= 35 && affection <= 35) return 'withdrawn';

  // Mid-band character states
  if (affection >= 70 && trust >= 60 && tension <= 30) return 'affectionate';
  if (affection >= 55 && tension >= 35 && tension < 60) return 'needy';
  if (respect >= 65 && tension >= 30 && tension < 60) return 'protective';
  if (affection >= 50 && tension <= 25) return 'playful';
  if (affection >= 40 && respect >= 50 && tension <= 40) return 'teasing';

  return 'neutral';
}

/**
 * Detect milestone crossings (25/50/75/90) for a given metric.
 * Returns the threshold crossed in the rising direction, or null.
 */
export function milestoneCrossed(prev: number, next: number): number | null {
  const thresholds = [25, 50, 75, 90];
  for (const t of thresholds) {
    if (prev < t && next >= t) return t;
  }
  return null;
}
