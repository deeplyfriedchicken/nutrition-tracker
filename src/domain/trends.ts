import { datesInRange } from "./dates";
import { isGoalMet } from "./goalMet";
import type { Range } from "./range";
import type { DayIndex, Nutrients, WeighInLog } from "./types";

/** One calendar date in a Range, for one nutrient. Stored units (g, kcal, ml). */
export type NutrientTrendRow = {
  date: string;
  isDay: boolean;
  /** The Day's total; null when the date isn't a Day. */
  total: number | null;
  /** The Day's own Goals Snapshot value; null when the date isn't a Day or the Day has no goal. */
  dayGoal: number | null;
  /** The stepped goal line: a Day's goal, carried forward across dates that aren't Days. */
  goalLine: number | null;
  /** Goal Met for the Day; null when the date isn't a Day or the Day has no goal. */
  met: boolean | null;
  /** True only for the In-progress Day (the Day whose date is today). */
  inProgress: boolean;
};

export type NutrientTrendSummary = {
  /** Some Day in the Range has a goal for this nutrient. */
  hasGoal: boolean;
  /** N: Days that met their goal (In-progress Day excluded). */
  metCount: number;
  /** M: Days that have a goal (In-progress Day excluded). */
  judgedCount: number;
  /** Mean total over the Days in the Range; null when there are none. */
  average: number | null;
};

export type NutrientTrend = { rows: NutrientTrendRow[]; summary: NutrientTrendSummary };

export function buildNutrientTrend(index: DayIndex, range: Range, nutrient: keyof Nutrients, today: string): NutrientTrend {
  let carriedGoal: number | null = null; // carried only from Days inside the Range
  const rows: NutrientTrendRow[] = datesInRange(range.from, range.to).map((date) => {
    const day = index.days[date];
    if (!day) {
      return { date, isDay: false, total: null, dayGoal: null, goalLine: carriedGoal, met: null, inProgress: false };
    }
    const total = day.totals[nutrient];
    const dayGoal = day.goals[nutrient];
    carriedGoal = dayGoal;
    return {
      date,
      isDay: true,
      total,
      dayGoal,
      goalLine: dayGoal,
      met: isGoalMet(nutrient, total, dayGoal),
      inProgress: date === today,
    };
  });

  return { rows, summary: summarizeNutrient(rows) };
}

function summarizeNutrient(rows: NutrientTrendRow[]): NutrientTrendSummary {
  const days = rows.filter((r) => r.isDay);
  const judged = days.filter((r) => r.met !== null && !r.inProgress);
  const totals = days.map((r) => r.total as number);
  return {
    hasGoal: days.some((r) => r.dayGoal !== null),
    metCount: judged.filter((r) => r.met).length,
    judgedCount: judged.length,
    average: totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : null,
  };
}

/** One calendar date in a Range: the latest Weigh-in on that date (kg), or null. */
export type WeightTrendRow = { date: string; kg: number | null };

export type WeightChange = {
  first: { date: string; kg: number };
  last: { date: string; kg: number };
  /** How many dates in the Range have a Weigh-in. */
  count: number;
};

/** One row per calendar date in the Range, independent of Days. Weigh-ins are never in progress. */
export function buildWeightTrend(log: WeighInLog, range: Range): WeightTrendRow[] {
  return datesInRange(range.from, range.to).map((date) => {
    const weighIns = log.weighIns[date] ?? [];
    if (weighIns.length === 0) return { date, kg: null };
    const latest = weighIns.reduce((a, b) => (b.recordedAt > a.recordedAt ? b : a));
    return { date, kg: latest.kg };
  });
}

/** Change from the first to the last Weigh-in in the rows; null when there are none. */
export function summarizeWeightChange(rows: WeightTrendRow[]): WeightChange | null {
  const weighed = rows.filter((r): r is { date: string; kg: number } => r.kg !== null);
  if (weighed.length === 0) return null;
  return { first: weighed[0], last: weighed[weighed.length - 1], count: weighed.length };
}
