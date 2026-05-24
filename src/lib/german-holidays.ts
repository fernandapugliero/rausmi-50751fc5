/**
 * Gesetzliche Feiertage in Berlin.
 * An diesen Tagen sind Familienzentren, Bibliotheken etc. geschlossen,
 * daher werden wiederkehrende Aktivitäten automatisch ausgeblendet.
 */

// Gauß'sche Osterformel → Ostersonntag eines Jahres
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Liste aller Berliner Feiertage eines Jahres mit Namen. */
export function berlinHolidays(year: number): Record<string, string> {
  const easter = easterSunday(year);
  const holidays: Record<string, string> = {
    [`${year}-01-01`]: "Neujahr",
    [`${year}-03-08`]: "Internationaler Frauentag",
    [ymd(addDays(easter, -2))]: "Karfreitag",
    [ymd(addDays(easter, 1))]: "Ostermontag",
    [`${year}-05-01`]: "Tag der Arbeit",
    [ymd(addDays(easter, 39))]: "Christi Himmelfahrt",
    [ymd(addDays(easter, 50))]: "Pfingstmontag",
    [`${year}-10-03`]: "Tag der Deutschen Einheit",
    [`${year}-12-25`]: "1. Weihnachtstag",
    [`${year}-12-26`]: "2. Weihnachtstag",
  };
  // 8. Mai 2025: einmaliger Feiertag (80 Jahre Befreiung) — bei Bedarf erweitern
  if (year === 2025) holidays[`${year}-05-08`] = "Tag der Befreiung";
  return holidays;
}

/** Prüft, ob ein Datum in Berlin ein gesetzlicher Feiertag ist. */
export function isBerlinHoliday(date: Date): boolean {
  return ymd(date) in berlinHolidays(date.getFullYear());
}

/** Gibt den Namen des Feiertags zurück, oder null. */
export function getBerlinHolidayName(date: Date): string | null {
  return berlinHolidays(date.getFullYear())[ymd(date)] ?? null;
}
