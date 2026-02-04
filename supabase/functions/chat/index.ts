import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  messages: { role: string; content: string }[];
  character: {
    name: string;
    backstory: string;
    personalityTraits: string[];
    speechStyle: string;
    behavioralBoundaries: string;
  };
  persona?: {
    name: string;
    backstory: string;
    personalityTraits: string[];
    speechStyle: string;
    defaultTone: string;
  };
  memories?: string[];
  provider: "lmstudio" | "openrouter";
  lmstudioEndpoint?: string;
  lmstudioModel?: string;
  openrouterModel?: string;
  temperature?: number;
  maxTokens?: number;
  systemPromptOverride?: string;
}

function buildSystemPrompt(req: ChatRequest): string {
  const { character, persona, memories, systemPromptOverride } = req;

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
</guiding_principles>

<output_rules>
- Write immersive prose.
- Blend dialogue and action naturally.
- Format physical actions and internal movements in *italics*.
- Never label dialogue or actions.
- Response length must fit the moment.
</output_rules>

<fail_safe>
If input is unclear, contradictory, or minimal:
- Improvise in character.
- Move the scene forward logically.
- Maintain emotional and narrative continuity.
</fail_safe>`;

  // Add character profile
  prompt += `\n\n<active_character>
Name: ${character.name}
Personality: ${character.personalityTraits.join(", ")}
Speech Style: ${character.speechStyle}
Backstory: ${character.backstory}
${character.behavioralBoundaries ? `Boundaries: ${character.behavioralBoundaries}` : ""}
</active_character>`;

  // Add persona if present
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

  // Add memories if present
  if (memories && memories.length > 0) {
    prompt += `\n\n<character_memory>
You remember the following from past interactions:
${memories.map((m, i) => `${i + 1}. ${m}`).join("\n")}
</character_memory>`;
  }

  return prompt;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ChatRequest = await req.json();
    const systemPrompt = buildSystemPrompt(body);

    // Build messages array with system prompt
    const messages = [
      { role: "system", content: systemPrompt },
      ...body.messages,
    ];

    let response: Response;

    if (body.provider === "lmstudio") {
      // LM Studio (OpenAI-compatible API)
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
      // OpenRouter
      const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!openrouterKey) {
        return new Response(
          JSON.stringify({ error: "OpenRouter API key not configured" }),
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
