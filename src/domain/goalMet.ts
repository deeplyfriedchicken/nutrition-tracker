import type { Nutrients } from "./types";

const AT_LEAST: ReadonlySet<keyof Nutrients> = new Set(["calories", "protein", "carbs", "fat", "fiber", "waterMl"]);
const AT_MOST: ReadonlySet<keyof Nutrients> = new Set(["sugar", "sodium"]);

/**
 * Whether a Day's total for one nutrient satisfies its Goals Snapshot.
 * Returns null when the nutrient has no goal (no Goal Met status).
 * Always compare against the Day's own Goals Snapshot, never current goals.
 */
export function isGoalMet(nutrient: keyof Nutrients, total: number, goal: number | null): boolean | null {
  if (goal === null) return null;
  if (AT_LEAST.has(nutrient)) return total >= goal;
  if (AT_MOST.has(nutrient)) return total <= goal;
  throw new Error(`Unknown nutrient: ${nutrient}`);
}
