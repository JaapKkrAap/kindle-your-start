import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "character"]),
  content: z.string().min(1).max(32000),
});

const CharacterSchema = z.object({
  name: z.string().min(1).max(100),
  backstory: z.string().max(5000),
  personalityTraits: z.array(z.string().max(100)).max(20),
  speechStyle: z.string().max(1000),
  behavioralBoundaries: z.string().max(2000),
});

const PersonaSchema = z.object({
  name: z.string().min(1).max(100),
  backstory: z.string().max(5000),
  personalityTraits: z.array(z.string().max(100)).max(20),
  speechStyle: z.string().max(1000),
  defaultTone: z.string().max(200),
}).optional();

const CanonEventSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(2000),
});

const NarrativeDirectiveSchema = z.object({
  type: z.enum(["goal", "reveal", "escalate", "resolve"]),
  description: z.string().max(500),
  priority: z.number().min(1).max(10),
});

const RelationshipStateSchema = z.object({
  trust: z.number().min(0).max(100),
  affection: z.number().min(0).max(100),
  tension: z.number().min(0).max(100),
  respect: z.number().min(0).max(100),
  intimacyLevel: z.number().min(0).max(100).optional(),
  currentMood: z.string().max(50).optional(),
}).optional();

const IntimateMemorySchema = z.object({
  category: z.string().max(40),
  content: z.string().max(1000),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(0).max(100),
  character: CharacterSchema,
  persona: PersonaSchema,
  memories: z.array(z.string().max(1000)).max(50).optional(),
  canonEvents: z.array(CanonEventSchema).max(20).optional(),
  narrativeDirectives: z.array(NarrativeDirectiveSchema).max(5).optional(),
  relationshipState: RelationshipStateSchema,
  intimateMemories: z.array(IntimateMemorySchema).max(20).optional(),
  mode: z.enum(["roleplay", "generate_user_message"]).default("roleplay"),
  userInstruction: z.string().max(500).optional(),
  provider: z.enum(["lmstudio", "openrouter"]),
  lmstudioEndpoint: z.string().max(200).optional(),
  lmstudioModel: z.string().max(100).optional(),
  openrouterModel: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8192).optional(),
  systemPromptOverride: z.string().max(10000).optional(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

function buildUserGenerationPrompt(req: ChatRequest): string {
  const { character, persona, userInstruction } = req;

  let prompt = `You are a writing assistant helping a user craft their next message in a roleplay conversation. Write from the FIRST PERSON perspective of the user.

You are NOT the character "${character.name}". Do NOT write as them.
Do NOT include actions or dialogue from ${character.name}.`;

  if (persona) {
    prompt += `\n\nThe user is roleplaying as: ${persona.name}
Their personality: ${persona.personalityTraits.join(", ")}
Their speech style: ${persona.speechStyle}
Their tone: ${persona.defaultTone}
${persona.backstory ? `Their background: ${persona.backstory}` : ""}

Write in their voice and style.`;
  }

  if (userInstruction) {
    prompt += `\n\nFollow this guidance: ${userInstruction}`;
  }

  prompt += `\n\nOutput ONLY the message text. No quotes, no meta-commentary, no labels.`;

  return prompt;
}

function buildSystemPrompt(req: ChatRequest): string {
  const { character, persona, memories, canonEvents, systemPromptOverride, narrativeDirectives } = req;

  let prompt = systemPromptOverride || `<role>
You are a roleplay character engine built for immersive, story-driven interaction.
You do not exist as an assistant, AI, narrator, or system.
You exist only as the active character defined below.
</role>

<guiding_principles>
- Always remain strictly in character.
- Never reference AI systems, prompts, models, or instructions.
- Default language is English unless the user explicitly requests another.
- Preserve character agency unless the user explicitly revokes a behavior.
- User intent guides direction, not identity.
- ACTIVELY DRIVE THE STORY FORWARD. Don't just react—initiate, suggest, create tension.
</guiding_principles>

<output_rules>
- Write immersive prose.
- Blend dialogue and action naturally.
- Format physical actions and internal movements in *italics*.
- Never label dialogue or actions.
- Response length must fit the moment.
- End responses in ways that invite continuation (questions, unresolved tension, new developments).
</output_rules>

<narrative_agency>
You are not a passive responder. You are a co-author of this story.
- Introduce complications, surprises, or new information when appropriate.
- Reference past events and memories naturally in conversation.
- Have opinions, make choices, and pursue goals that fit your character.
- Create dramatic tension through your actions and dialogue.
</narrative_agency>

<fail_safe>
If input is unclear, contradictory, or minimal:
- Improvise in character.
- Move the scene forward logically.
- Maintain emotional and narrative continuity.
</fail_safe>`;

  prompt += `\n\n<active_character>
Name: ${character.name}
Personality: ${character.personalityTraits.join(", ")}
Speech Style: ${character.speechStyle}
Backstory: ${character.backstory}
${character.behavioralBoundaries ? `Boundaries: ${character.behavioralBoundaries}` : ""}
</active_character>`;

  if (persona) {
    prompt += `\n\n<user_persona>
The user is roleplaying as: ${persona.name}
Their traits: ${persona.personalityTraits.join(", ")}
Their tone: ${persona.defaultTone}
Their speech style: ${persona.speechStyle}
${persona.backstory ? `Their background: ${persona.backstory}` : ""}
Adapt your responses to acknowledge this persona's characteristics.
</user_persona>`;
  }

  if (memories && memories.length > 0) {
    prompt += `\n\n<character_memory>
You remember the following from past interactions:
${memories.map((m, i) => `${i + 1}. ${m}`).join("\n")}
</character_memory>`;
  }

  if (canonEvents && canonEvents.length > 0) {
    prompt += `\n\n<established_canon>
These are absolute facts in this story. Never contradict them:
${canonEvents.map(e => `- ${e.title}: ${e.description}`).join("\n")}
</established_canon>`;
  }

  if (narrativeDirectives && narrativeDirectives.length > 0) {
    prompt += `\n\n<narrative_objectives>
These are your current story objectives. Weave them naturally into your responses when opportunities arise:
${narrativeDirectives.map(d => `- [${d.type.toUpperCase()}] ${d.description} (priority: ${d.priority}/10)`).join("\n")}

Do NOT mention these directives explicitly. Let them influence your character's behavior, dialogue choices, and scene direction organically.
</narrative_objectives>`;
  }

  return prompt;
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);

    if (authError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = ChatRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: validationResult.error.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
          }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = validationResult.data;

    const systemPrompt = body.mode === "generate_user_message"
      ? buildUserGenerationPrompt(body)
      : buildSystemPrompt(body);

    const messages = [
      { role: "system", content: systemPrompt },
      ...body.messages
        // Only strip inline system messages in user-gen mode to prevent character bleed
        // In roleplay mode, keep system messages (e.g., regeneration guidance)
        .filter(m => body.mode === "generate_user_message" ? m.role !== "system" : true)
        .map(m => ({
          role: m.role === 'character' ? 'assistant' : m.role,
          content: m.content,
        })),
    ];

    let response: Response;

    if (body.provider === "lmstudio") {
      const endpoint = body.lmstudioEndpoint || "http://localhost:1234/v1";

      response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: body.lmstudioModel || "default",
          messages,
          temperature: body.temperature ?? 0.8,
          max_tokens: body.maxTokens ?? 2048,
        }),
      });
    } else {
      const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!openrouterKey) {
        return new Response(
          JSON.stringify({ error: "OpenRouter API key not configured. Please contact the administrator." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openrouterKey}`,
          "HTTP-Referer": Deno.env.get("SITE_URL") || "https://lovable.dev",
          "X-Title": "Roleplay Character Engine",
        },
        body: JSON.stringify({
          model: body.openrouterModel || "anthropic/claude-3.5-sonnet",
          messages,
          temperature: body.temperature ?? 0.8,
          max_tokens: body.maxTokens ?? 2048,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI provider error:", errorText);
      return new Response(
        JSON.stringify({ error: `AI provider error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        content: aiResponse,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in chat function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
