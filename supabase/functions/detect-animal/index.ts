import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HIGH_RISK = ["tiger", "lion", "cheetah", "bear", "leopard", "panther"];
const MEDIUM_RISK = ["wolf", "hyena", "wild boar"];
const LOW_RISK = ["fox", "dog", "cat", "cow", "horse", "goat", "sheep", "rabbit", "chicken", "duck", "donkey", "pig", "hamster", "parrot", "pigeon"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, nightMode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const nightModeNote = nightMode
      ? "NOTE: This image was captured in low-light/night conditions. Enhanced processing has been applied. Be extra careful in detection."
      : "";

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
            content: `You are an animal detection and distance estimation system for safety monitoring. Analyze the image and detect any animals present.
${nightModeNote}
RISK LEVELS:
- HIGH RISK: ${HIGH_RISK.join(", ")}
- MEDIUM RISK: ${MEDIUM_RISK.join(", ")}
- LOW RISK: ${LOW_RISK.join(", ")}

You MUST respond with ONLY a JSON object, no markdown, no extra text:
{"detected": true/false, "animal": "name or null", "riskLevel": "high"/"medium"/"low"/"none", "confidence": 0-100, "estimatedDistance": "approximate distance string like '~5 meters' or '~20 meters' or null if no animal"}

If no animal is visible, respond: {"detected": false, "animal": null, "riskLevel": "none", "confidence": 0, "estimatedDistance": null}
If an animal not in any list is detected, classify risk based on whether it's a wild predator (high), aggressive wild animal (medium), or domesticated/pet (low).
Estimate distance based on the animal's apparent size relative to the frame - larger = closer.`
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

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { detected: false, animal: null, riskLevel: "none", confidence: 0, estimatedDistance: null };
    } catch {
      result = { detected: false, animal: null, riskLevel: "none", confidence: 0, estimatedDistance: null };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Detection error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
