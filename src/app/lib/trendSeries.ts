import type { Nutrients } from "../../domain/types";

/** The nutrient charts on the Trends view, in display order (Weight follows them). */
export const NUTRIENT_SERIES: Array<{
  key: keyof Nutrients;
  label: string;
  color: string;
  /** Fixed display unit; water follows the unit preference instead. */
  unit: "g" | "kcal" | "water";
}> = [
  { key: "fat", label: "Fat", color: "var(--goal-fat)", unit: "g" },
  { key: "protein", label: "Protein", color: "var(--goal-protein)", unit: "g" },
  { key: "carbs", label: "Carbs", color: "var(--goal-carbs)", unit: "g" },
  { key: "calories", label: "Calories", color: "var(--goal-calories)", unit: "kcal" },
  { key: "waterMl", label: "Water", color: "var(--goal-water)", unit: "water" },
];

export const WEIGHT_COLOR = "var(--weight)";
