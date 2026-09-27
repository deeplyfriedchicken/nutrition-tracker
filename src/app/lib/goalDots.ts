import type { Nutrients } from "../../domain/types";

/** The four nutrients shown as calendar dots / detail chips, in display order. */
export const GOAL_DOT_NUTRIENTS: Array<{ key: keyof Nutrients; label: string; color: string }> = [
  { key: "fat", label: "Fat", color: "var(--goal-fat)" },
  { key: "protein", label: "Protein", color: "var(--goal-protein)" },
  { key: "carbs", label: "Carbs", color: "var(--goal-carbs)" },
  { key: "waterMl", label: "Water", color: "var(--goal-water)" },
];
