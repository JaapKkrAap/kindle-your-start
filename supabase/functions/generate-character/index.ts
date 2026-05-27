import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { existingData, preferences, userOpenrouterApiKey, userOpenaiApiKey } = await req.json();

    // Resolve API keys: server secrets take priority, user-provided keys as fallback
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY") || userOpenrouterApiKey;
    const openaiKey = Deno.env.get("OPENAI_API_KEY") || userOpenaiApiKey;

    if (!openrouterKey && !openaiKey) {
      return new Response(
        JSON.stringify({ error: "No API key configured. Add an OpenAI or OpenRouter key in Settings → API Keys." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filledFields: string[] = [];
    const emptyFields: string[] = [];

    const fields = ["name", "backstory", "speechStyle", "behavioralBoundaries", "firstMessage"];
    for (const f of fields) {
      if (existingData?.[f]?.trim()) {
        filledFields.push(f);
      } else {
        emptyFields.push(f);
      }
    }

    const existingTraits = existingData?.personalityTraits?.length > 0;
    if (!existingTraits) emptyFields.push("personalityTraits");

    let contextBlock = "";
    if (filledFields.length > 0) {
      contextBlock = `\nThe user has already provided these fields — treat them as IMMUTABLE constraints:\n`;
      for (const f of filledFields) {
        contextBlock += `- ${f}: "${existingData[f]}"\n`;
      }
      if (existingTraits) {
        contextBlock += `- personalityTraits: ${JSON.stringify(existingData.personalityTraits)}\n`;
      }
    }

    let prefBlock = "";
    if (preferences) {
      const parts: string[] = [];
      if (preferences.genre) parts.push(`Genre/Setting: ${preferences.genre}`);
      if (preferences.characterType) parts.push(`Character type: ${preferences.characterType}`);
      if (preferences.tone) parts.push(`Tone: ${preferences.tone}`);
      if (parts.length > 0) {
        prefBlock = `\nUser preferences:\n${parts.join("\n")}\n`;
      }
    }

    const prompt = `You are a character generator for a roleplay application.
Generate a complete, coherent roleplay character.
${contextBlock}${prefBlock}
Generate ONLY the fields that are missing or empty. Missing fields: ${emptyFields.join(", ")}

Rules:
- name: A fitting character name for the setting/tone
- personalityTraits: Array of 4-6 short traits. ${existingTraits ? `Keep existing traits [${existingData.personalityTraits.join(", ")}] and add up to 3 more.` : "Generate 4-6 traits."}
- backstory: 1-2 paragraphs, narrative style, connects to traits and setting
- speechStyle: Concrete description of how they talk (tone, tempo, word choice, quirks)
- behavioralBoundaries: Short list of what the character will/won't do (can be empty string if not applicable)
- firstMessage: Written fully in-character, must immediately convey personality and tone. No meta-text.

Return ONLY valid JSON with this exact structure, no markdown wrapping:
{
  "name": "string",
  "backstory": "string",
  "personalityTraits": ["string"],
  "speechStyle": "string",
  "behavioralBoundaries": "string",
  "firstMessage": "string"
}

For fields the user already filled, return them unchanged.`;

    // Use OpenRouter when available, otherwise fall back to OpenAI
    const response = openrouterKey
      ? await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey}`,
            "X-Title": "Kindle Your Start — Character Generator",
          },
          body: JSON.stringify({
            model: "anthropic/claude-3-haiku",
            messages: [
              { role: "system", content: "You are a character generator. Return only valid JSON, no markdown code blocks or additional text." },
              { role: "user", content: prompt },
            ],
            temperature: 0.85,
            max_tokens: 2000,
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
            messages: [
              { role: "system", content: "You are a character generator. Return only valid JSON, no markdown code blocks or additional text." },
              { role: "user", content: prompt },
            ],
            temperature: 0.85,
            max_completion_tokens: 2000,
          }),
        });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "";

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    const generated = JSON.parse(content);

    return new Response(JSON.stringify(generated), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-character error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate character" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
