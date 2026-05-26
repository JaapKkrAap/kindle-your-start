import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractMemoriesRequest {
  sessionId: string;
  characterId: string;
  personaId?: string;
  afterMessageId?: string;
}

interface Memory {
  category:
    | "event" | "relationship" | "location" | "item"
    | "persona_impression" | "emotional_shift"
    | "kink" | "promise" | "secret" | "favorite";
  content: string;
  importance: number;
}

interface RelationshipDeltas {
  trust: number;
  affection: number;
  tension: number;
  respect: number;
  intimacy: number;
}

// Mood derivation duplicated server-side (kept minimal, matches src/lib/relationship.ts).
function deriveMood(s: { trust: number; affection: number; tension: number; respect: number; intimacy: number }): string {
  const { trust, affection, tension, respect, intimacy } = s;
  if (affection >= 85 && intimacy >= 70) return "obsessed";
  if (affection >= 70 && tension >= 60) return "jealous";
  if (trust <= 25 && tension >= 60) return "cold";
  if (affection <= 25 && tension >= 70) return "tense";
  if (trust <= 35 && affection <= 35) return "withdrawn";
  if (affection >= 70 && trust >= 60 && tension <= 30) return "affectionate";
  if (affection >= 55 && tension >= 35 && tension < 60) return "needy";
  if (respect >= 65 && tension >= 30 && tension < 60) return "protective";
  if (affection >= 50 && tension <= 25) return "playful";
  if (affection >= 40 && respect >= 50 && tension <= 40) return "teasing";
  return "neutral";
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const body: ExtractMemoriesRequest = await req.json();
    const { sessionId, characterId, personaId, afterMessageId } = body;

    let query = supabaseClient
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (afterMessageId) {
      const { data: afterMsg } = await supabaseClient
        .from('chat_messages')
        .select('created_at')
        .eq('id', afterMessageId)
        .single();
      if (afterMsg) query = query.gt('created_at', afterMsg.created_at);
    }

    const { data: messages, error: msgError } = await query;
    if (msgError) throw msgError;
    if (!messages || messages.length < 2) {
      return new Response(
        JSON.stringify({ extracted: 0, message: 'Not enough messages to extract from' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingMemories } = await supabaseClient
      .from('memories').select('content').eq('character_id', characterId);
    const existingContents = new Set(existingMemories?.map(m => m.content.toLowerCase()) ?? []);

    const conversationText = messages
      .map(m => `${m.role === 'character' ? 'Character' : 'User'}: ${m.content}`)
      .join('\n\n');

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterKey) {
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ----- Pass 1: memory extraction (now with intimate categories) -----
    const extractionPrompt = `Analyze this roleplay conversation and extract important facts the character should remember.

<conversation>
${conversationText}
</conversation>

Extract memories in these categories:
- event: Significant events
- relationship: Relationship dynamics
- location: Places mentioned/visited
- item: Objects of significance
- persona_impression: Character's impression of the user
- emotional_shift: Notable emotional changes
- kink: Sexual/romantic preferences the user revealed
- promise: Commitments either party made
- secret: Private information the user shared
- favorite: Things the user explicitly likes (people, places, activities)

For each memory:
1. Write from the CHARACTER's perspective
2. One concise sentence
3. Rate importance 1-10

Skip trivial exchanges. Use ONLY the categories listed.

Respond ONLY with a JSON array: [{"category":"event","content":"...","importance":7}, ...]
If nothing memorable: [].`;

    // ----- Pass 2: relationship delta scoring -----
    const deltaPrompt = `Read this roleplay exchange and score how the character's feelings toward the user shifted.

<conversation>
${conversationText}
</conversation>

For EACH metric, return an integer delta from -10 to +10 (0 if unchanged):
- trust: did the user prove reliable, honest, consistent? (betrayals are negative)
- affection: warmth, romance, emotional closeness
- tension: stress, conflict, friction (positive = MORE tension, negative = relief)
- respect: did the user show competence, integrity, strength?
- intimacy: physical or emotional intimate revelations/contact

Respond ONLY with JSON: {"trust":N,"affection":N,"tension":N,"respect":N,"intimacy":N}`;

    const aiCall = (prompt: string) => fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openrouterKey}` },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const [memResp, deltaResp] = await Promise.all([aiCall(extractionPrompt), aiCall(deltaPrompt)]);

    // Parse memories
    let extractedMemories: Memory[] = [];
    if (memResp.ok) {
      const aiData = await memResp.json();
      const aiContent = aiData.choices?.[0]?.message?.content ?? "[]";
      try {
        extractedMemories = JSON.parse(aiContent.replace(/```json\n?|\n?```/g, '').trim());
      } catch (e) {
        console.error("Failed to parse memory extraction:", aiContent);
      }
    }

    // Parse deltas
    let deltas: RelationshipDeltas = { trust: 0, affection: 0, tension: 0, respect: 0, intimacy: 0 };
    if (deltaResp.ok) {
      const dData = await deltaResp.json();
      const dContent = dData.choices?.[0]?.message?.content ?? "{}";
      try {
        const parsed = JSON.parse(dContent.replace(/```json\n?|\n?```/g, '').trim());
        deltas = {
          trust: clamp(Number(parsed.trust) || 0, -10, 10),
          affection: clamp(Number(parsed.affection) || 0, -10, 10),
          tension: clamp(Number(parsed.tension) || 0, -10, 10),
          respect: clamp(Number(parsed.respect) || 0, -10, 10),
          intimacy: clamp(Number(parsed.intimacy) || 0, -10, 10),
        };
      } catch (e) {
        console.error("Failed to parse deltas:", dContent);
      }
    }

    // ----- Apply relationship deltas -----
    let relationshipStateOut: Record<string, unknown> | null = null;
    try {
      let stateQuery = supabaseClient
        .from('relationship_states')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', userId);
      stateQuery = personaId
        ? stateQuery.eq('persona_id', personaId)
        : stateQuery.is('persona_id', null);
      const { data: existingState } = await stateQuery.maybeSingle();

      const prev = existingState ?? {
        trust: 50, affection: 50, tension: 0, respect: 50, intimacy_level: 0,
      };
      const next = {
        trust: clamp((prev.trust ?? 50) + deltas.trust, 0, 100),
        affection: clamp((prev.affection ?? 50) + deltas.affection, 0, 100),
        tension: clamp((prev.tension ?? 0) + deltas.tension, 0, 100),
        respect: clamp((prev.respect ?? 50) + deltas.respect, 0, 100),
        intimacy_level: clamp((prev.intimacy_level ?? 0) + deltas.intimacy, 0, 100),
      };
      const mood = deriveMood({
        trust: next.trust, affection: next.affection, tension: next.tension,
        respect: next.respect, intimacy: next.intimacy_level,
      });

      const onConflict = personaId
        ? 'character_id, persona_id, user_id'
        : 'character_id, user_id';

      const { data: upserted, error: upErr } = await supabaseClient
        .from('relationship_states')
        .upsert({
          character_id: characterId,
          persona_id: personaId ?? null,
          user_id: userId,
          ...next,
          current_mood: mood,
          mood_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict })
        .select()
        .single();

      if (upErr) console.error("Relationship upsert error:", upErr);
      else relationshipStateOut = upserted as Record<string, unknown>;
    } catch (e) {
      console.error("Failed to update relationship state:", e);
    }

    // ----- Insert memories -----
    const validCategories = new Set([
      'event', 'relationship', 'location', 'item', 'persona_impression', 'emotional_shift',
      'kink', 'promise', 'secret', 'favorite',
    ]);

    const newMemories = extractedMemories.filter(m =>
      m.importance >= 5 &&
      validCategories.has(m.category) &&
      !existingContents.has(m.content.toLowerCase())
    );

    if (newMemories.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('memories')
        .insert(newMemories.map(m => ({
          user_id: userId,
          character_id: characterId,
          persona_id: personaId ?? null,
          category: m.category,
          content: m.content,
          importance: m.importance,
          source_message_id: messages[messages.length - 1].id,
        })));
      if (insertError) console.error("Memory insert error:", insertError);
    }

    return new Response(
      JSON.stringify({
        extracted: newMemories.length,
        memories: newMemories,
        relationshipDeltas: deltas,
        relationshipState: relationshipStateOut,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error in extract-memories function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
