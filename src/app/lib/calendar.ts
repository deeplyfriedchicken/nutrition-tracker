export type MonthKey = { year: number; month: number }; // month is 0-11

export function monthKeyFromDate(dateStr: string): MonthKey {
  const [y, m] = dateStr.split("-").map(Number);
  return { year: y, month: m - 1 };
}

export function monthKeyToLabel(key: MonthKey): string {
  const d = new Date(Date.UTC(key.year, key.month, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const total = key.year * 12 + key.month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export function monthKeyOrder(key: MonthKey): number {
  return key.year * 12 + key.month;
}

export function monthKeysEqual(a: MonthKey, b: MonthKey): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Bounds for calendar navigation: the month of the earliest Day through the current month. */
export function navBounds(dayDatesAsc: string[], today: string): { min: MonthKey; max: MonthKey } {
  const max = monthKeyFromDate(today);
  const min = dayDatesAsc.length > 0 ? monthKeyFromDate(dayDatesAsc[0]) : max;
  return { min, max };
}

/** Sunday-first grid cells for a month: null for leading/trailing blanks, else a YYYY-MM-DD string. */
export function monthGridCells(key: MonthKey): Array<string | null> {
  const first = new Date(Date.UTC(key.year, key.month, 1));
  const firstWeekday = first.getUTCDay(); // 0 = Sunday
  const daysInMonth = new Date(Date.UTC(key.year, key.month + 1, 0)).getUTCDate();

  const cells: Array<string | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(key.month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    cells.push(`${key.year}-${mm}-${dd}`);
  }
  return cells;
}

export function weekdayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(date).toUpperCase();
}

export function longDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

export function dayOfMonth(dateStr: string): number {
  return Number(dateStr.split("-")[2]);
}

function utcDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** "Sep 14" (chart ticks). */
export function shortDateLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(utcDate(dateStr));
}

/** "Sat, Sep 26" (chart tooltips). */
export function tooltipDateLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    utcDate(dateStr),
  );
}

/** "Sep 14–Sep 27"; both ends get the year when the Range isn't inside today's year. */
export function rangeLabel(range: { from: string; to: string }, today: string): string {
  const year = today.slice(0, 4);
  if (range.from.startsWith(year) && range.to.startsWith(year)) {
    return `${shortDateLabel(range.from)}–${shortDateLabel(range.to)}`;
  }
  const withYear = (d: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(utcDate(d));
  return `${withYear(range.from)}–${withYear(range.to)}`;
}
