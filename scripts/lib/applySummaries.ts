import { amySummaryToDay } from "../../src/domain/convert";
import type { AmyNutritionSummary } from "../../src/amy/schemas";
import type { DayIndex } from "../../src/domain/types";
import { writeDay, deleteDay } from "./io";

/**
 * Applies one Amy→Day conversion per summary: writes the Day file and upserts
 * its index row when Items exist, or deletes both when they don't. Mutates
 * `index.days` in place; callers persist the index afterward.
 */
export async function applySummaries(dataDir: string, index: DayIndex, summaries: AmyNutritionSummary[]): Promise<void> {
  for (const summary of summaries) {
    const day = amySummaryToDay(summary);
    if (day) {
      await writeDay(dataDir, day);
      index.days[day.date] = { totals: day.totals, goals: day.goals };
    } else {
      await deleteDay(dataDir, summary.date);
      delete index.days[summary.date];
    }
  }
}
