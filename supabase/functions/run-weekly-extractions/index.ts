import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: sources, error } = await supabase
    .from("sources")
    .select("id, name")
    .eq("is_active", true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<{ source: string; ok: boolean; detail?: unknown }> = [];

  for (const s of sources ?? []) {
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/extract-source`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ source_id: s.id }),
      });
      const body = await r.json().catch(() => ({}));
      results.push({ source: s.name, ok: r.ok, detail: body });
    } catch (e) {
      results.push({ source: s.name, ok: false, detail: String(e) });
    }
    // pequeno delay para não esmagar a Gateway de IA
    await new Promise((res) => setTimeout(res, 1500));
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
