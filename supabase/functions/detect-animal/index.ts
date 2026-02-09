import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HARMFUL_ANIMALS = ["tiger", "lion", "cheetah", "wolf", "fox", "bear", "leopard", "panther", "hyena", "wild boar"];
const SAFE_ANIMALS = ["dog", "cat", "cow", "horse", "goat", "sheep", "rabbit", "chicken", "duck", "donkey", "pig", "hamster", "parrot", "pigeon"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an animal detection system for safety monitoring. Analyze the image and detect any animals present.

HARMFUL animals: ${HARMFUL_ANIMALS.join(", ")}
SAFE animals: ${SAFE_ANIMALS.join(", ")}

You MUST respond with ONLY a JSON object, no markdown, no extra text:
{"detected": true/false, "animal": "name or null", "category": "harmful"/"safe"/"none", "confidence": 0-100}

If no animal is visible, respond: {"detected": false, "animal": null, "category": "none", "confidence": 0}
If an animal not in either list is detected, classify it as "safe" if it's a domesticated/pet animal, or "harmful" if it's a wild predator.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this camera frame for any animals. Respond with JSON only." },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, retrying..." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response, handling potential markdown wrapping
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { detected: false, animal: null, category: "none", confidence: 0 };
    } catch {
      result = { detected: false, animal: null, category: "none", confidence: 0 };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Detection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
