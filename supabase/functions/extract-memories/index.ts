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
  userOpenrouterApiKey?: string;
  userOpenaiApiKey?: string;
}

interface Memory {
  category: "event" | "relationship" | "location" | "item" | "persona_impression" | "emotional_shift";
  content: string;
  importance: number;
}

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

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from the JWT token directly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = user.id;

    const body: ExtractMemoriesRequest = await req.json();
    const { sessionId, characterId, personaId, afterMessageId, userOpenrouterApiKey, userOpenaiApiKey } = body;

    // Fetch recent messages from the session
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
      
      if (afterMsg) {
        query = query.gt('created_at', afterMsg.created_at);
      }
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) throw msgError;
    if (!messages || messages.length < 2) {
      return new Response(
        JSON.stringify({ extracted: 0, message: 'Not enough messages to extract from' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing memories to avoid duplicates
    const { data: existingMemories } = await supabaseClient
      .from('memories')
      .select('content')
      .eq('character_id', characterId);

    const existingContents = new Set(existingMemories?.map(m => m.content.toLowerCase()) ?? []);

    // Format conversation for extraction
    const conversationText = messages
      .map(m => `${m.role === 'character' ? 'Character' : 'User'}: ${m.content}`)
      .join('\n\n');

    // Call AI to extract memories
    // Try OpenRouter first (server key → user key), then OpenAI as fallback
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY") || userOpenrouterApiKey;
    const openaiKey = Deno.env.get("OPENAI_API_KEY") || userOpenaiApiKey;

    if (!openrouterKey && !openaiKey) {
      // Silently skip extraction rather than erroring — chat should still work
      return new Response(
        JSON.stringify({ extracted: 0, message: "No API key available for memory extraction — configure one in Settings." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractionPrompt = `Analyze this roleplay conversation and extract important facts that the character should remember for future interactions.

<conversation>
${conversationText}
</conversation>

Extract memories in these categories:
- event: Significant events that happened in the story
- relationship: Relationship dynamics, how characters relate to each other
- location: Places mentioned or visited
- item: Objects, possessions, or items of significance
- persona_impression: Character's impression of the user's personality/identity
- emotional_shift: Notable emotional changes or reactions

For each memory:
1. Write it from the CHARACTER's perspective (what they learned/observed)
2. Be specific and concise (one sentence)
3. Rate importance 1-10 (10 = crucial to remember)

Only extract genuinely memorable information. Skip small talk and trivial exchanges.
IMPORTANT: Only use these exact categories: event, relationship, location, item, persona_impression, emotional_shift

Respond ONLY with valid JSON array:
[{"category": "event", "content": "...", "importance": 7}, ...]

If nothing worth remembering, respond with empty array: []`;

    // Use OpenRouter when key available, otherwise fall back to OpenAI
    const response = openrouterKey
      ? await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey}`,
            "X-Title": "Kindle Your Start — Memory Extraction",
          },
          body: JSON.stringify({
            model: "anthropic/claude-3-haiku",
            messages: [{ role: "user", content: extractionPrompt }],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        })
      : await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: extractionPrompt }],
            temperature: 0.3,
            max_completion_tokens: 1000,
          }),
        });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI extraction error:", errorText);
      return new Response(
        JSON.stringify({ error: `AI extraction failed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content ?? "[]";

    // Parse extracted memories
    let extractedMemories: Memory[] = [];
    try {
      const jsonStr = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      extractedMemories = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse extraction response:", aiContent);
      return new Response(
        JSON.stringify({ extracted: 0, error: "Failed to parse AI response" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Valid categories as per database constraint
    const validCategories = new Set(['event', 'relationship', 'location', 'item', 'persona_impression', 'emotional_shift']);

    // Filter out duplicates, low-importance memories, and invalid categories
    const newMemories = extractedMemories.filter(m => 
      m.importance >= 5 && 
      validCategories.has(m.category) &&
      !existingContents.has(m.content.toLowerCase())
    );

    // Insert new memories
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

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        extracted: newMemories.length,
        memories: newMemories,
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
