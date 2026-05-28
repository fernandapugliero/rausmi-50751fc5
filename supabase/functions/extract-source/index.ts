// Edge function: extract activities from a source URL using Lovable AI (Gemini).
// Called from /admin/quellen ("Jetzt ausführen") or from a weekly cron.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ExtractedActivity {
  title: string;
  description?: string | null;
  recurrence: "weekly" | "monthly_nth" | "once";
  weekday?: number | null; // 0=Mon ... 6=Sun
  monthly_nth?: number | null; // 1..5
  specific_date?: string | null; // YYYY-MM-DD
  start_time_local: string; // HH:MM
  end_time_local?: string | null;
  age_min_months?: number | null;
  age_max_months?: number | null;
  is_free: boolean;
  price_info?: string | null;
  registration_required: boolean;
  registration_url?: string | null;
  category?: string | null;
  notes?: string | null;
  pause_from?: string | null;
  pause_until?: string | null;
}

// ─── Berlin timezone helpers ──────────────────────────────────────────────

function berlinOffsetHours(date: Date): number {
  // Get Berlin's UTC offset (1 in winter, 2 in summer) for the date.
  const s = date.toLocaleString("en-US", {
    timeZone: "Europe/Berlin",
    timeZoneName: "shortOffset",
  });
  const m = s.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!m) return 1;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * parseInt(m[2], 10);
}

function berlinLocalToUTC(year: number, monthIdx: number, day: number, hour: number, minute: number): Date {
  const naive = new Date(Date.UTC(year, monthIdx, day, hour, minute));
  const offset = berlinOffsetHours(naive);
  return new Date(naive.getTime() - offset * 3600 * 1000);
}

function parseHHMM(s: string): [number, number] {
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return [0, 0];
  return [parseInt(m[1], 10), parseInt(m[2], 10)];
}

function nextOccurrenceWeekly(weekdayMon0: number, hour: number, minute: number, from = new Date()): Date {
  // Find next Berlin-local date with given weekday (0=Mon..6=Sun).
  // We compute in Berlin local calendar.
  const berlinNow = new Date(from.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const jsDow = berlinNow.getDay(); // 0=Sun..6=Sat
  const monDow = (jsDow + 6) % 7; // 0=Mon..6=Sun
  let delta = (weekdayMon0 - monDow + 7) % 7;
  // If today is the target day, check if the time already passed
  if (delta === 0) {
    const todaySlot = new Date(berlinNow);
    todaySlot.setHours(hour, minute, 0, 0);
    if (berlinNow.getTime() > todaySlot.getTime()) delta = 7;
  }
  const target = new Date(berlinNow);
  target.setDate(target.getDate() + delta);
  return berlinLocalToUTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    hour,
    minute,
  );
}

function nextOccurrenceMonthlyNth(nth: number, weekdayMon0: number, hour: number, minute: number, from = new Date()): Date {
  // nth-th weekday of the month (1..5), going forward.
  const berlinNow = new Date(from.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  for (let monthAhead = 0; monthAhead < 4; monthAhead++) {
    const year = berlinNow.getFullYear();
    const monthIdx = berlinNow.getMonth() + monthAhead;
    // Find first occurrence of weekday in that month
    const firstOfMonth = new Date(Date.UTC(year, monthIdx, 1));
    const jsDow = firstOfMonth.getUTCDay();
    const monDow = (jsDow + 6) % 7;
    const offset = (weekdayMon0 - monDow + 7) % 7;
    const day = 1 + offset + (nth - 1) * 7;
    const candidate = new Date(Date.UTC(year, monthIdx, day));
    if (candidate.getUTCMonth() !== ((monthIdx % 12) + 12) % 12) continue; // overflow
    const utc = berlinLocalToUTC(candidate.getUTCFullYear(), candidate.getUTCMonth(), candidate.getUTCDate(), hour, minute);
    if (utc.getTime() > from.getTime()) return utc;
  }
  // Fallback: 4 weeks ahead
  return nextOccurrenceWeekly(weekdayMon0, hour, minute, from);
}

// ─── External key (dedupe) ────────────────────────────────────────────────

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Stable title for dedupe: strip parenthetical subtitles "(...)" and any
// suffix after " - "/" – "/" — " so the AI adding/removing a German subtitle
// across runs does not create a new key for the same activity.
function stableTitleKey(title: string): string {
  const base = title
    .replace(/\([^)]*\)/g, " ")
    .split(/\s[-–—]\s/)[0];
  return slug(base);
}

function externalKey(a: ExtractedActivity): string {
  const parts = [stableTitleKey(a.title)];
  if (a.recurrence === "weekly") {
    parts.push(`w${a.weekday ?? "x"}`, a.start_time_local);
  } else if (a.recurrence === "monthly_nth") {
    parts.push(`m${a.monthly_nth ?? "x"}-${a.weekday ?? "x"}`, a.start_time_local);
  } else {
    parts.push(a.specific_date ?? "no-date", a.start_time_local);
  }
  return parts.join("|");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}


function ageGroupsFromMonths(min?: number | null, max?: number | null): string[] {
  if (min == null && max == null) return [];
  const lo = min ?? 0;
  const hi = max ?? 999;
  const out: string[] = [];
  if (lo <= 6 && hi >= 0) out.push("0-6 months");
  if (lo <= 12 && hi >= 6) out.push("6-12 months");
  if (lo <= 24 && hi >= 12) out.push("1-2 years");
  if (lo <= 36 && hi >= 24) out.push("2-3 years");
  if (hi >= 36) out.push("3+ years");
  return out;
}

// ─── Main handler ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Verify user is admin
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { source_id, force } = await req.json();
    if (!source_id) return json({ error: "source_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: source, error: srcErr } = await admin
      .from("sources")
      .select("*")
      .eq("id", source_id)
      .single();
    if (srcErr || !source) return json({ error: "Source not found" }, 404);

    // Create run
    const { data: run } = await admin
      .from("source_runs")
      .insert({ source_id, status: "running", model: "google/gemini-2.5-flash-lite" })
      .select()
      .single();
    const runId = run!.id;

    try {
      // Fetch source HTML (main + extras)
      const urls = [source.url, ...(source.extra_urls ?? [])];
      const fetched: string[] = [];
      const fetchErrors: string[] = [];
      const BROWSER_HEADERS = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      };
      for (const url of urls) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 20000);
          const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: "follow", signal: ctrl.signal });
          clearTimeout(timer);
          if (!res.ok) {
            fetchErrors.push(`${url} → HTTP ${res.status}`);
            continue;
          }
          const html = await res.text();
          // Strip HTML tags crudely to save tokens
          const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 30000);
          fetched.push(`--- Source: ${url} ---\n${text}`);
        } catch (e) {
          fetchErrors.push(`${url} → ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      if (fetched.length === 0) {
        const detail = fetchErrors.join("; ") || "no URLs configured";
        await admin.from("source_runs").update({
          status: "failed",
          error: `Could not fetch any source URL: ${detail}`,
          finished_at: new Date().toISOString(),
        }).eq("id", runId);
        return json({ error: `Could not fetch source URL. ${detail}` }, 502);
      }

      // ── Skip unchanged sources ──────────────────────────────────────────
      // Hash the combined page text. If it matches the hash stored on the last
      // successful run, the page content has not changed → skip the (expensive)
      // AI call entirely. `force: true` (manual "Jetzt ausführen") bypasses this.
      const contentHash = await sha256Hex(fetched.join("\n\n"));
      if (!force && source.content_hash && source.content_hash === contentHash) {
        await admin.from("source_runs").update({
          status: "skipped",
          error: "Inhalt unverändert seit letztem Lauf — KI-Aufruf übersprungen.",
          finished_at: new Date().toISOString(),
        }).eq("id", runId);
        await admin.from("sources").update({ last_run_at: new Date().toISOString() }).eq("id", source_id);
        return json({ success: true, skipped: true, reason: "unchanged" });
      }


      const today = new Date().toISOString().slice(0, 10);
      const systemPrompt = `Du extrahierst Kinder-Aktivitäten (0-6 Jahre) aus Webseiten von Berliner Familienzentren.
Heute ist ${today}. Antworte AUSSCHLIESSLICH durch den Aufruf von return_activities.

Regeln:
- Nur Angebote für Kinder 0-6 Jahre und ihre Eltern. Yoga ohne Kind, Workshops nur für Erwachsene NICHT extrahieren.
- weekday: 0=Montag, 1=Dienstag, 2=Mittwoch, 3=Donnerstag, 4=Freitag, 5=Samstag, 6=Sonntag.
- recurrence "weekly" = jede Woche am gleichen Tag/Zeit.
- recurrence "monthly_nth" = z.B. "jeden 2. Sonntag", dann monthly_nth=2 und weekday=6.
- recurrence "once" = einmaliges Event mit konkretem Datum (specific_date).
- Pausen/Ferien: Wenn die Webseite eine Pause nennt (z.B. "Sommerpause 10.8.-21.8.2026"), trage die Daten STRUKTURIERT in pause_from und pause_until ein (Format YYYY-MM-DD). NICHT zusätzlich in notes oder description schreiben.
- description: kurze sachliche Beschreibung der Aktivität selbst. KEINE Hinweise zu Pausen, Anmeldung oder Preisen — diese gehören in die eigenen Felder.
- Falls eine Altersangabe fehlt, age_min_months=0 und age_max_months=72 setzen.
- is_free: true wenn "kostenfrei"/"gratis" steht oder nichts zu Kosten erwähnt wird. Nur false wenn explizit ein Preis oder eine Gebühr genannt wird.
- registration_required: STANDARD ist false. NUR true, wenn DIREKT NEBEN dieser konkreten Aktivität ein expliziter Hinweis wie "Anmeldung erforderlich", "nur mit Anmeldung", "geschlossener Kurs", "Voranmeldung nötig" oder eine konkrete Anmelde-E-Mail/-URL für genau diese Aktivität steht. 
  WICHTIG: Globale Hinweise wie "Bitte für alle Kurse anmelden", "Bei Interesse melden Sie sich", allgemeine Telefonnummern oder Newsletter-Hinweise zählen NICHT — sie gelten dem Haus, nicht der einzelnen Aktivität. Offene Treffs ("offener Treff", "Familientreff", "Krabbelgruppe ohne Anmeldung", "Drop-in") sind IMMER registration_required=false.`;

      const userPrompt = fetched.join("\n\n");

      const tool = {
        type: "function",
        function: {
          name: "return_activities",
          description: "Return the list of extracted activities.",
          parameters: {
            type: "object",
            properties: {
              activities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    recurrence: { type: "string", enum: ["weekly", "monthly_nth", "once"] },
                    weekday: { type: "integer", minimum: 0, maximum: 6 },
                    monthly_nth: { type: "integer", minimum: 1, maximum: 5 },
                    specific_date: { type: "string", description: "YYYY-MM-DD" },
                    start_time_local: { type: "string", description: "HH:MM 24h" },
                    end_time_local: { type: "string", description: "HH:MM 24h" },
                    age_min_months: { type: "integer" },
                    age_max_months: { type: "integer" },
                    is_free: { type: "boolean" },
                    price_info: { type: "string" },
                    registration_required: { type: "boolean" },
                    registration_url: { type: "string" },
                    category: { type: "string" },
                    notes: { type: "string" },
                    pause_from: { type: "string", description: "YYYY-MM-DD, Start einer Pause/Ferien-Periode" },
                    pause_until: { type: "string", description: "YYYY-MM-DD, Ende einer Pause/Ferien-Periode (inklusiv)" },
                  },
                  required: ["title", "recurrence", "start_time_local", "is_free", "registration_required"],
                },
              },
            },
            required: ["activities"],
          },
        },
      };

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "return_activities" } },
        }),
      });

      if (!aiRes.ok) {
        const txt = await aiRes.text();
        await admin.from("source_runs").update({
          status: "failed",
          error: `AI gateway ${aiRes.status}: ${txt.slice(0, 500)}`,
          finished_at: new Date().toISOString(),
        }).eq("id", runId);
        if (aiRes.status === 429) return json({ error: "Rate limit. Bitte später erneut versuchen." }, 429);
        if (aiRes.status === 402) return json({ error: "Lovable AI Credits aufgebraucht." }, 402);
        return json({ error: `AI error ${aiRes.status}` }, 500);
      }

      const aiData = await aiRes.json();
      const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
      const args = toolCall?.function?.arguments
        ? JSON.parse(toolCall.function.arguments)
        : { activities: [] };
      const extracted: ExtractedActivity[] = args.activities ?? [];

      // Upsert into activities
      const now = new Date();
      let newCount = 0;
      let updatedCount = 0;

      // Pre-fetch existing activities for this source so we can match by a
      // STABLE signature (stable title + recurrence) instead of the exact
      // external_key. This makes dedupe robust to the AI rewording a title
      // (adding/removing a German subtitle) between runs.
      const { data: existingRows } = await admin
        .from("activities")
        .select("id, is_approved, external_key, title, recurrence_rule, start_time")
        .eq("source_id", source_id);
      const sigOf = (title: string, rule: string | null, startIso: string | null) => {
        const base = stableTitleKey(title);
        const rec = rule ?? `once:${(startIso ?? "").slice(0, 10)}`;
        return `${base}::${rec}`;
      };
      const existingBySig = new Map<string, { id: string; is_approved: boolean }>();
      for (const ex of existingRows ?? []) {
        const sig = sigOf(ex.title ?? "", ex.recurrence_rule ?? null, ex.start_time ?? null);
        if (!existingBySig.has(sig)) existingBySig.set(sig, { id: ex.id, is_approved: ex.is_approved });
      }

      for (const a of extracted) {
        try {
          const [h, m] = parseHHMM(a.start_time_local);
          const [eh, em] = a.end_time_local ? parseHHMM(a.end_time_local) : [null, null];
          let startUtc: Date;
          let endUtc: Date | null = null;

          if (a.recurrence === "weekly" && a.weekday != null) {
            startUtc = nextOccurrenceWeekly(a.weekday, h, m, now);
          } else if (a.recurrence === "monthly_nth" && a.weekday != null && a.monthly_nth != null) {
            startUtc = nextOccurrenceMonthlyNth(a.monthly_nth, a.weekday, h, m, now);
          } else if (a.recurrence === "once" && a.specific_date) {
            const [y, mo, d] = a.specific_date.split("-").map(Number);
            startUtc = berlinLocalToUTC(y, mo - 1, d, h, m);
          } else {
            continue;
          }
          if (eh != null && em != null) {
            endUtc = new Date(startUtc.getTime() + ((eh - h) * 60 + (em - m)) * 60_000);
          }

          const extKey = externalKey(a);
          // description: only the actual activity description — pauses go into structured fields,
          // notes are kept internal (not shown on cards).
          const description = a.description?.trim() || null;
          const isValidDate = (s?: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

          // ── Duplicate detection vs. already-approved activities ──
          // Match by normalized title at any venue whose name is related to this source
          // (handles legacy entries with longer location names like "FaNN – Familienhaus …").
          const normalize = (s: string) => s.toLowerCase().normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
          const normTitle = normalize(a.title);
          const normSourceName = normalize(source.name);
          let duplicateOf: string | null = null;
          if (normTitle.length >= 4) {
            const { data: approvedCandidates } = await admin
              .from("activities")
              .select("id, title, location_name, district")
              .eq("district", source.district)
              .eq("is_approved", true);
            for (const cand of approvedCandidates ?? []) {
              const candTitle = normalize(cand.title ?? "");
              const candLoc = normalize(cand.location_name ?? "");
              if (!candTitle || !candLoc) continue;
              const sameVenue =
                candLoc === normSourceName ||
                candLoc.includes(normSourceName) ||
                normSourceName.includes(candLoc);
              if (!sameVenue) continue;
              if (candTitle === normTitle || candTitle.includes(normTitle) || normTitle.includes(candTitle)) {
                duplicateOf = cand.id;
                break;
              }
            }
          }

          const row = {
            source_id,
            external_key: extKey,
            last_seen_at: now.toISOString(),
            title: a.title,
            description,
            location_name: source.name,
            district: source.district,
            address: source.address,
            latitude: source.latitude,
            longitude: source.longitude,
            start_time: startUtc.toISOString(),
            end_time: endUtc?.toISOString() ?? null,
            recurring: a.recurrence !== "once",
            recurrence_rule: a.recurrence === "weekly"
              ? `weekly:${a.weekday}`
              : a.recurrence === "monthly_nth"
                ? `monthly_nth:${a.monthly_nth}:${a.weekday}`
                : null,
            age_groups: ageGroupsFromMonths(a.age_min_months, a.age_max_months),
            is_free: a.is_free,
            price_info: a.price_info ?? null,
            registration_required: a.registration_required,
            registration_url: a.registration_url ?? null,
            category: a.category ?? source.default_category ?? null,
            image_url: source.default_image_url,
            source: "ai-extraction",
            source_url: source.url,
            is_approved: false,
            duplicate_of_activity_id: duplicateOf,
            pause_from: isValidDate(a.pause_from) ? a.pause_from : null,
            pause_until: isValidDate(a.pause_until) ? a.pause_until : null,
          };

          // Match against existing rows by STABLE signature (handles title drift).
          const sig = sigOf(a.title, row.recurrence_rule, row.start_time);
          const existing = existingBySig.get(sig);

          if (existing) {
            // Update only metadata; keep is_approved as-is. Also rewrite the
            // external_key so storage converges to the stable format.
            const { is_approved, ...rest } = row;
            await admin.from("activities").update(rest).eq("id", existing.id);
            updatedCount++;
          } else {
            await admin.from("activities").insert(row);
            // Remember within this run so a second equivalent title doesn't
            // get inserted twice in the same extraction.
            existingBySig.set(sig, { id: "pending", is_approved: false });
            newCount++;
          }

        } catch (e) {
          console.error("Failed to upsert activity:", a.title, e);
        }
      }

      await admin.from("source_runs").update({
        status: extracted.length === 0 ? "empty" : "success",
        found_count: extracted.length,
        new_count: newCount,
        updated_count: updatedCount,
        raw_response: extracted as unknown as object,
        finished_at: new Date().toISOString(),
      }).eq("id", runId);

      // Store the content hash only on a real (non-empty) successful run so a
      // future identical fetch can be skipped without an AI call.
      await admin.from("sources").update({
        last_run_at: new Date().toISOString(),
        content_hash: extracted.length > 0 ? contentHash : source.content_hash,
      }).eq("id", source_id);

      return json({ success: true, found: extracted.length, new: newCount, updated: updatedCount });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await admin.from("source_runs").update({
        status: "failed",
        error: msg.slice(0, 1000),
        finished_at: new Date().toISOString(),
      }).eq("id", runId);
      return json({ error: msg }, 500);
    }
  } catch (e) {
    console.error("extract-source error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
