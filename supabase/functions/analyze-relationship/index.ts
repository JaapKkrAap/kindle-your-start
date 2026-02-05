import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RelationshipAnalysisRequest {
    sessionId: string;
    characterId: string;
    personaId?: string;
}

interface RelationshipState {
    trust: number;
    affection: number;
    tension: number;
    respect: number;
}

interface AnalysisResult {
    trust: number;
    affection: number;
    tension: number;
    respect: number;
    reasoning: string;
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

        const token = authHeader.replace('Bearer ', '');
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = user.id;
        const { sessionId, characterId, personaId }: RelationshipAnalysisRequest = await req.json();

        // 1. Fetch character details for context
        const { data: character } = await supabaseClient
            .from('characters')
            .select('name, personality_traits, backstory')
            .eq('id', characterId)
            .single();

        // 2. Fetch last 10 messages from the session
        const { data: messages, error: msgError } = await supabaseClient
            .from('chat_messages')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (msgError) throw msgError;
        if (!messages || messages.length < 2) {
            return new Response(
                JSON.stringify({ error: 'Not enough messages to analyze' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Sort messages back to chronological order
        const conversationHistory = messages.reverse();

        // 3. Fetch current relationship state
        let stateQuery = supabaseClient
            .from('relationship_states')
            .select('trust, affection, tension, respect')
            .eq('character_id', characterId)
            .eq('user_id', userId);

        if (personaId) {
            stateQuery = stateQuery.eq('persona_id', personaId);
        } else {
            stateQuery = stateQuery.is('persona_id', null);
        }

        const { data: currentState } = await stateQuery.maybeSingle();

        const current: RelationshipState = currentState || {
            trust: 50,
            affection: 50,
            tension: 20,
            respect: 50
        };

        // 4. Call OpenRouter (Claude Haiku) for analysis
        const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
        if (!openrouterKey) throw new Error("OpenRouter API key not configured");

        const conversationText = conversationHistory
            .map(m => `${m.role === 'character' ? character?.name || 'Character' : 'User'}: ${m.content}`)
            .join('\n\n');

        const analysisPrompt = `Analyze the psychological state and relationship dynamics in this roleplay conversation.

Character Profile:
Name: ${character?.name}
Traits: ${character?.personality_traits?.join(', ')}
Backstory: ${character?.backstory}

Current Relationship Stats (0-100):
- Trust: ${current.trust} (Confidence in the other)
- Affection: ${current.affection} (Liking/Warmth)
- Tension: ${current.tension} (Stress/Sexual Tension/Conflict)
- Respect: ${current.respect} (Esteem/Admiration)

Recent Conversation:
${conversationText}

Task:
Based on the tone, content, and subtext of the recent messages, suggest ADJUSTMENTS to these 4 stats.
- Each adjustment should be between -10 and +10.
- 0 means no change.
- Consider the character's personality and how they would react to the user's words/actions.

Respond ONLY with valid JSON:
{
  "trust": number,
  "affection": number,
  "tension": number,
  "respect": number,
  "reasoning": "short explanation of the changes"
}`;

        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openrouterKey}`,
            },
            body: JSON.stringify({
                model: "anthropic/claude-3-haiku",
                messages: [{ role: "user", content: analysisPrompt }],
                temperature: 0.2,
                response_format: { type: "json_object" }
            }),
        });

        if (!aiResponse.ok) throw new Error(`AI analysis failed: ${aiResponse.status}`);

        const aiData = await aiResponse.json();
        const result: AnalysisResult = JSON.parse(aiData.choices[0].message.content);

        // 5. Apply changes & Clamp (0-100)
        const clamp = (val: number) => Math.min(100, Math.max(0, val));
        const newState = {
            trust: clamp(current.trust + (result.trust || 0)),
            affection: clamp(current.affection + (result.affection || 0)),
            tension: clamp(current.tension + (result.tension || 0)),
            respect: clamp(current.respect + (result.respect || 0)),
        };

        // 6. Update Database
        const { data: updatedData, error: upsertError } = await supabaseClient
            .from('relationship_states')
            .upsert({
                character_id: characterId,
                persona_id: personaId ?? null,
                user_id: userId,
                ...newState,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'character_id, persona_id, user_id'
            })
            .select()
            .single();

        if (upsertError) throw upsertError;

        return new Response(
            JSON.stringify({
                success: true,
                newState: updatedData,
                changes: {
                    trust: result.trust,
                    affection: result.affection,
                    tension: result.tension,
                    respect: result.respect
                },
                reasoning: result.reasoning
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
