/**
 * Activity data layer — powered by Lovable Cloud (Supabase).
 * Reads approved activities and expands recurrence rules into individual
 * occurrences within a 14-day horizon.
 */
import { supabase } from "@/integrations/supabase/client";
import type { BerlinDistrict } from "./types";

// ─── Normalised activity used throughout the app ───────────────────────────
export interface AirtableActivity {
  id: string;
  title: string;
  description: string | null;
  location_name: string;
  address: string | null;
  district: BerlinDistrict;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  start_time: string;
  end_time: string | null;
  age_groups: string[];
  is_free: boolean;
  price_info: string | null;
  registration_required: boolean;
  source: string | null;
  source_url: string | null;
  recurring: boolean;
  recurrence_rule: string | null;
  category: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  submitted_by: string | null;
  submitter_email: string | null;
  submitter_name: string | null;
  // UI extras
  _distance?: number | null;
  _nextOccurrence?: Date | null;
  _ageLabel?: string | null;
  _sponsored?: boolean;
  _registrationLink?: string | null;
  _verifiedAt?: string | null;
  _recurrenceType?: string | null;
  _dayOfWeek?: string | null;
}

const DAY_NAMES_DE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

// ─── Cache ─────────────────────────────────────────────────────────────────
let _cache: AirtableActivity[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export function clearAirtableCache() {
  _cache = null;
  _cacheTime = 0;
}

// ─── Recurrence helpers ────────────────────────────────────────────────────

function nthWeekdayOfMonth(year: number, month: number, weekdayMon0: number, n: number): Date | null {
  const first = new Date(year, month, 1);
  // JS getDay: 0=Sun..6=Sat → convert to Mon0
  const firstMon0 = (first.getDay() + 6) % 7;
  const day = 1 + ((weekdayMon0 - firstMon0 + 7) % 7) + (n - 1) * 7;
  const d = new Date(year, month, day);
  if (d.getMonth() !== month) return null;
  return d;
}

/** Expand one DB activity row into N occurrences in the horizon. */
function expandRecurrence(
  row: {
    id: string;
    recurrence_rule: string | null;
    start_time: string;
    end_time: string | null;
    pause_from?: string | null;
    pause_until?: string | null;
  },
  horizonStart: Date,
  horizonEnd: Date,
): { start: string; end: string | null; dayOfWeek: string | null }[] {
  const anchor = new Date(row.start_time);
  const anchorEnd = row.end_time ? new Date(row.end_time) : null;
  const durationMs = anchorEnd ? anchorEnd.getTime() - anchor.getTime() : 0;
  const hh = anchor.getHours();
  const mm = anchor.getMinutes();

  const pauseFrom = row.pause_from ? new Date(row.pause_from + "T00:00:00") : null;
  const pauseUntil = row.pause_until ? new Date(row.pause_until + "T23:59:59") : null;
  const inPause = (d: Date) =>
    pauseFrom && pauseUntil && d >= pauseFrom && d <= pauseUntil;

  const makeOcc = (d: Date) => {
    const start = new Date(d);
    start.setHours(hh, mm, 0, 0);
    if (inPause(start)) return null;
    const end = durationMs > 0 ? new Date(start.getTime() + durationMs) : null;
    return {
      start: start.toISOString(),
      end: end ? end.toISOString() : null,
      dayOfWeek: DAY_NAMES_DE[(start.getDay() + 6) % 7] ?? null,
    };
  };

  const rule = row.recurrence_rule ?? "";

  // weekly:<mon0>
  const weeklyMatch = rule.match(/^weekly:(\d)$/);
  if (weeklyMatch) {
    const wd = parseInt(weeklyMatch[1], 10);
    const out: ReturnType<typeof makeOcc>[] = [];
    const d = new Date(horizonStart);
    d.setHours(0, 0, 0, 0);
    const curMon0 = (d.getDay() + 6) % 7;
    const delta = (wd - curMon0 + 7) % 7;
    d.setDate(d.getDate() + delta);
    while (d <= horizonEnd) {
      const occ = makeOcc(d);
      if (new Date(occ.start) >= horizonStart && new Date(occ.start) <= horizonEnd) out.push(occ);
      d.setDate(d.getDate() + 7);
    }
    return out;
  }

  // monthly:<weeks>:<mon0>  (e.g. monthly:1,3:1) — also accept monthly_nth:<n>:<mon0>
  const monthlyMulti = rule.match(/^monthly:([\d,]+):(\d)$/);
  const monthlyNth = rule.match(/^monthly_nth:(\d):(\d)$/);
  if (monthlyMulti || monthlyNth) {
    const weeks = monthlyMulti
      ? monthlyMulti[1].split(",").map((w) => parseInt(w, 10)).filter((n) => !isNaN(n))
      : [parseInt(monthlyNth![1], 10)];
    const wd = parseInt((monthlyMulti ?? monthlyNth)![2], 10);
    const out: ReturnType<typeof makeOcc>[] = [];
    for (let mo = 0; mo <= 1; mo++) {
      const ref = new Date(horizonStart);
      ref.setMonth(ref.getMonth() + mo);
      for (const w of weeks) {
        const d = nthWeekdayOfMonth(ref.getFullYear(), ref.getMonth(), wd, w);
        if (!d) continue;
        const occ = makeOcc(d);
        if (new Date(occ.start) >= horizonStart && new Date(occ.start) <= horizonEnd) out.push(occ);
      }
    }
    return out;
  }

  // No rule → one-off: include if start_time within horizon
  if (anchor >= horizonStart && anchor <= horizonEnd) {
    return [{
      start: anchor.toISOString(),
      end: anchorEnd ? anchorEnd.toISOString() : null,
      dayOfWeek: DAY_NAMES_DE[(anchor.getDay() + 6) % 7] ?? null,
    }];
  }
  return [];
}

// ─── Main loader ───────────────────────────────────────────────────────────
export async function loadAirtableActivities(): Promise<AirtableActivity[]> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("is_approved", true)
    .is("duplicate_of_activity_id", null);

  if (error) {
    console.error("Failed to load activities:", error);
    return [];
  }

  const now = new Date();
  const horizonStart = new Date(now);
  horizonStart.setHours(0, 0, 0, 0);
  const horizonEnd = new Date(now);
  horizonEnd.setDate(horizonEnd.getDate() + 14);
  horizonEnd.setHours(23, 59, 59, 999);

  const out: AirtableActivity[] = [];
  for (const row of data ?? []) {
    const occurrences = expandRecurrence(row, horizonStart, horizonEnd);
    for (const occ of occurrences) {
      out.push({
        id: `${row.id}__${occ.start}`,
        title: row.title,
        description: row.description,
        location_name: row.location_name,
        address: row.address,
        district: row.district as BerlinDistrict,
        latitude: row.latitude,
        longitude: row.longitude,
        image_url: row.image_url,
        start_time: occ.start,
        end_time: occ.end,
        age_groups: (row.age_groups ?? []) as string[],
        is_free: row.is_free,
        price_info: row.price_info,
        registration_required: row.registration_required,
        source: row.source,
        source_url: row.source_url,
        recurring: row.recurring ?? false,
        recurrence_rule: row.recurrence_rule,
        category: row.category,
        is_approved: true,
        created_at: row.created_at,
        updated_at: row.updated_at,
        submitted_by: row.submitted_by,
        submitter_email: row.submitter_email,
        submitter_name: row.submitter_name,
        _dayOfWeek: occ.dayOfWeek,
        _recurrenceType: row.recurring ? "weekly" : "once",
        _sponsored: false,
      });
    }
  }

  out.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  _cache = out;
  _cacheTime = Date.now();
  return out;
}
