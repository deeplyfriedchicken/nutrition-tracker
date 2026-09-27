import { addDays, firstOfMonth, isValidDateString } from "./dates";

/** An inclusive span of calendar dates (YYYY-MM-DD) in Amy's timezone. */
export type Range = { from: string; to: string };

export type RangePreset = "last7" | "last14" | "thisMonth" | "allLogged";

type RangeContext = {
  /** Today in Amy's timezone. */
  today: string;
  /** Every Day's date, ascending. */
  dayDates: string[];
};

/** The Range a preset stands for; null for All logged days when there are no Days. */
export function presetRange(preset: RangePreset, { today, dayDates }: RangeContext): Range | null {
  switch (preset) {
    case "last7":
      return { from: addDays(today, -6), to: today };
    case "last14":
      return { from: addDays(today, -13), to: today };
    case "thisMonth":
      return { from: firstOfMonth(today), to: today };
    case "allLogged":
      return dayDates.length > 0 ? { from: dayDates[0], to: dayDates[dayDates.length - 1] } : null;
  }
}

export const RANGE_PRESETS: readonly RangePreset[] = ["last7", "last14", "thisMonth", "allLogged"];

/** Pull either end that is after today back to today, then swap if from is later than to. */
export function normalizeRange(from: string, to: string, today: string): Range {
  const a = from > today ? today : from;
  const b = to > today ? today : to;
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

/** The Range from the URL's from/to; Last 7 days if either is missing or not a real date. */
export function rangeFromUrl(params: { from: string | null; to: string | null }, { today }: { today: string }): Range {
  const { from, to } = params;
  if (from === null || to === null || !isValidDateString(from) || !isValidDateString(to)) {
    return { from: addDays(today, -6), to: today };
  }
  return normalizeRange(from, to, today);
}

/** Every preset whose Range equals the given Range (derived, never stored). */
export function matchingPresets(range: Range, ctx: RangeContext): RangePreset[] {
  return RANGE_PRESETS.filter((preset) => {
    const r = presetRange(preset, ctx);
    return r !== null && r.from === range.from && r.to === range.to;
  });
}
