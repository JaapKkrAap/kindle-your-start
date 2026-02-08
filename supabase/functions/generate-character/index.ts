import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { existingData, preferences } = await req.json();

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

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a character generator. Return only valid JSON, no markdown code blocks or additional text." },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 2000,
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
      JSON.stringify({ error: error.message || "Failed to generate character" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
