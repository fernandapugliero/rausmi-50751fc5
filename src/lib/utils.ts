import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInMinutes, isToday, isTomorrow, format } from "date-fns";
import { de } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRelativeTimeLabel(startTime: Date, endTime?: Date | null): { label: string; type: "live" | "soon" | "normal" } {
  const now = new Date();
  const diffMin = differenceInMinutes(startTime, now);

  if (endTime && now >= startTime && now <= endTime) {
    return { label: "Läuft gerade", type: "live" };
  }
  if (now >= startTime && !endTime) {
    return { label: "Läuft gerade", type: "live" };
  }
  if (diffMin > 0 && diffMin <= 120) {
    if (diffMin < 60) {
      return { label: `Beginnt in ${diffMin} Min.`, type: "soon" };
    }
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    const timeStr = mins > 0 ? `${hours} Std. ${mins} Min.` : `${hours} Std.`;
    return { label: `Beginnt in ${timeStr}`, type: "soon" };
  }
  return { label: "", type: "normal" };
}

export function formatActivityTime(startTime: Date, endTime?: Date | null): string {
  const timeStr = format(startTime, "HH:mm");
  const endStr = endTime ? ` – ${format(endTime, "HH:mm")}` : "";
  
  if (isToday(startTime) || isTomorrow(startTime)) {
    return `${timeStr}${endStr}`;
  }
  return `${timeStr}${endStr} · ${format(startTime, "EEE, dd. MMM", { locale: de })}`;
}

export function getAgeLabel(age: string): string {
  const map: Record<string, string> = {
    "0-1": "0–1 J.",
    "1-3": "1–3 J.",
    "3+": "3+ J.",
    "0-6 months": "0–1 J.",
    "6-12 months": "0–1 J.",
    "1-2 years": "1–3 J.",
    "2-3 years": "1–3 J.",
    "3+ years": "3+ J.",
  };
  return map[age] || age;
}

export function getCategoryIcon(category?: string | null): string {
  if (!category) return "";
  const map: Record<string, string> = {
    kreativ: "🎨",
    musik: "🎵",
    krabbelgruppe: "🧸",
    draußen: "🌳",
    sport: "⚽",
    lesen: "📚",
  };
  return map[category.toLowerCase()] || "";
}

const DAY_NAMES_DE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function joinDe(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  if (parts.length === 2) return `${parts[0]} und ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} und ${parts[parts.length - 1]}`;
}

/**
 * Format a recurrence rule + day-of-week into a human-readable German label.
 * Accepts either a recurrence rule (weekly:X / monthly:1,3:X / monthly_nth:n:X)
 * or a plain day name as fallback.
 */
export function getRecurringDayLabel(ruleOrDay: string | null | undefined, dayOfWeek?: string | null): string {
  if (!ruleOrDay) return dayOfWeek ? `Jeden ${dayOfWeek}` : "";

  const weekly = ruleOrDay.match(/^weekly:(\d)$/);
  if (weekly) {
    const day = DAY_NAMES_DE[parseInt(weekly[1], 10)] ?? dayOfWeek ?? "";
    return `Jeden ${day}`;
  }

  const monthly = ruleOrDay.match(/^monthly:([\d,]+):(\d)$/);
  const monthlyNth = ruleOrDay.match(/^monthly_nth:(\d):(\d)$/);
  if (monthly || monthlyNth) {
    const weeks = monthly
      ? monthly[1].split(",").map((w) => parseInt(w, 10)).filter((n) => !isNaN(n))
      : [parseInt(monthlyNth![1], 10)];
    const wd = parseInt((monthly ?? monthlyNth)![2], 10);
    const day = DAY_NAMES_DE[wd] ?? dayOfWeek ?? "";
    return `${joinDe(weeks.map((w) => `${w}.`))} ${day} im Monat`;
  }

  // Plain day name fallback (legacy callers)
  if (DAY_NAMES_DE.includes(ruleOrDay)) return `Jeden ${ruleOrDay}`;
  return dayOfWeek ? `Jeden ${dayOfWeek}` : ruleOrDay;
}
