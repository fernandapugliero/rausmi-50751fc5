import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const CRON_SECRET = Deno.env.get("CRON_SECRET");

  // Authenticate caller: either a valid CRON_SECRET header (for the scheduler)
  // or an authenticated admin user (for manual triggering from the app).
  const providedSecret =
    req.headers.get("x-cron-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  let authorized = !!(CRON_SECRET && providedSecret && providedSecret === CRON_SECRET);

  if (!authorized) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace("Bearer ", "");
        const { data: claimsData } = await userClient.auth.getClaims(token);
        const uid = claimsData?.claims?.sub;
        if (uid) {
          const admin = createClient(SUPABASE_URL, SERVICE_KEY);
          const { data: roleRow } = await admin
            .from("user_roles")
            .select("role")
            .eq("user_id", uid)
            .eq("role", "admin")
            .maybeSingle();
          authorized = !!roleRow;
        }
      } catch (_) {
        // fall through to 401
      }
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: sources, error } = await supabase
    .from("sources")
    .select("id, name, crawl_mode")
    .eq("is_active", true)
    .eq("crawl_mode", "auto");

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
