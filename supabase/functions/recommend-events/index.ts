import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile and registrations
    const [{ data: profile }, { data: registrations }, { data: allEvents }] = await Promise.all([
      supabase.from("profiles").select("full_name, interests").eq("user_id", userId).single(),
      supabase.from("registrations").select("event_id, events(title, category, tags)").eq("user_id", userId).neq("status", "cancelled"),
      supabase.from("events").select("id, title, category, tags, description, date, available_seats").gte("date", new Date().toISOString()).order("date"),
    ]);

    const registeredIds = new Set((registrations || []).map((r: any) => r.event_id));
    const registeredCategories = (registrations || []).map((r: any) => r.events?.category).filter(Boolean);
    const registeredTags = (registrations || []).flatMap((r: any) => r.events?.tags || []);
    const availableEvents = (allEvents || []).filter((e: any) => !registeredIds.has(e.id) && e.available_seats > 0);

    if (availableEvents.length === 0) {
      return new Response(JSON.stringify({ recommendations: [{ title: "No events available", reason: "All upcoming events are full or you're already registered." }] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an event recommendation engine. Based on user data, suggest the top 3-5 events they should attend.

User: ${profile?.full_name || "Unknown"}
Interests: ${(profile?.interests || []).join(", ") || "Not specified"}
Previously registered categories: ${registeredCategories.join(", ") || "None"}
Previously registered tags: ${[...new Set(registeredTags)].join(", ") || "None"}

Available events:
${availableEvents.map((e: any) => `- ID: ${e.id} | "${e.title}" | Category: ${e.category} | Tags: ${(e.tags || []).join(", ")} | Seats: ${e.available_seats}`).join("\n")}

Return a JSON array of recommendations. Each item should have: eventId (UUID), title (string), reason (string explaining why this event suits the user). Use the tool provided.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "recommend_events",
            description: "Return event recommendations for the user",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      eventId: { type: "string" },
                      title: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["eventId", "title", "reason"],
                  },
                },
              },
              required: ["recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_events" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);

      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limited, try again later" : "Credits exhausted" }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ recommendations: args.recommendations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: simple scoring
    const scored = availableEvents.map((e: any) => {
      let score = 0;
      if (registeredCategories.includes(e.category)) score += 3;
      (e.tags || []).forEach((t: string) => { if (registeredTags.includes(t)) score += 1; });
      return { ...e, score };
    }).sort((a: any, b: any) => b.score - a.score).slice(0, 3);

    return new Response(JSON.stringify({
      recommendations: scored.map((e: any) => ({
        eventId: e.id,
        title: e.title,
        reason: `Matches your interest in ${e.category} events`,
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
