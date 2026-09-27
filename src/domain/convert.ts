import type { AmyNutritionSummary, AmyItem } from "../amy/schemas";
import type { Day, Goals, Item, Nutrients } from "./types";

function toNutrients(t: AmyNutritionSummary["totals"]): Nutrients {
  return {
    calories: t.calories,
    protein: t.protein,
    carbs: t.carbs,
    fat: t.fat,
    sugar: t.sugar ?? 0,
    fiber: t.fiber,
    sodium: t.sodium,
    waterMl: t.water_milliliters,
  };
}

function toGoals(g: AmyNutritionSummary["goals"]): Goals {
  return {
    calories: g.calories,
    protein: g.protein,
    carbs: g.carbs,
    fat: g.fat,
    sugar: g.sugar,
    fiber: g.fiber,
    sodium: g.sodium,
    waterMl: g.water_milliliters,
  };
}

function toItem(item: AmyItem): Item {
  return {
    id: item.id,
    description: item.description,
    detailedDescription: item.detailed_description,
    aiComment: item.ai_comment,
    confidence: item.confidence_score,
    isWater: item.is_water_entry,
    updatedAt: item.updated_at,
    nutrition: {
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      sugar: item.sugar,
      fiber: item.fiber,
      sodium: item.sodium,
      waterMl: item.water_milliliters,
    },
  };
}

/**
 * Converts one Amy nutrition-summary response into a Day, or null when Amy
 * has no Items for that date (a Day only exists when at least one is logged).
 */
export function amySummaryToDay(summary: AmyNutritionSummary): Day | null {
  const ordered = summary.entries
    .flatMap((entry) => entry.items.map((item) => ({ entryCreatedAt: entry.created_at, item })))
    .sort((a, b) => {
      if (a.entryCreatedAt !== b.entryCreatedAt) {
        return a.entryCreatedAt < b.entryCreatedAt ? -1 : 1;
      }
      return a.item.line_index - b.item.line_index;
    })
    .map(({ item }) => toItem(item));

  if (ordered.length === 0) return null;

  return {
    schemaVersion: 1,
    date: summary.date,
    timezone: summary.timezone,
    totals: toNutrients(summary.totals),
    goals: toGoals(summary.goals),
    items: ordered,
  };
}
