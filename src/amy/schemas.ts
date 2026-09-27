import { z } from "zod";

// Nutrition totals as returned by Amy. Docs list `sugar` as "number or null"
// even though every captured fixture has a number; tolerate null defensively.
const amyNutrients = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  sugar: z.number().nullable(),
  fiber: z.number(),
  sodium: z.number(),
  water_milliliters: z.number(),
});

// Goals mirror the user's current settings and may be individually unset.
const amyGoals = z.object({
  calories: z.number().nullable(),
  protein: z.number().nullable(),
  carbs: z.number().nullable(),
  fat: z.number().nullable(),
  sugar: z.number().nullable(),
  fiber: z.number().nullable(),
  sodium: z.number().nullable(),
  water_milliliters: z.number().nullable(),
});

// Fields the public docs omit but every captured fixture includes.
const amyItem = z.object({
  id: z.string(),
  description: z.string(),
  detailed_description: z.string().nullable(),
  ai_comment: z.string().nullable(),
  confidence_score: z.number().nullable(),
  is_water_entry: z.boolean(),
  water_milliliters: z.number(),
  line_index: z.number(),
  updated_at: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  sugar: z.number(),
  fiber: z.number(),
  sodium: z.number(),
});

const amyEntry = z.object({
  id: z.string(),
  date: z.string(),
  totals: amyNutrients,
  items: z.array(amyItem),
  created_at: z.string(),
});

export const nutritionSummarySchema = z.object({
  date: z.string(),
  timezone: z.string(),
  totals: amyNutrients,
  goals: amyGoals,
  entries: z.array(amyEntry),
});
export type AmyNutritionSummary = z.infer<typeof nutritionSummarySchema>;
export type AmyEntry = z.infer<typeof amyEntry>;
export type AmyItem = z.infer<typeof amyItem>;

export const foodEntriesSchema = z.object({
  entries: z.array(amyEntry),
  limit: z.number(),
});
export type AmyFoodEntries = z.infer<typeof foodEntriesSchema>;

const amyWeighIn = z.object({
  id: z.string(),
  weight_kg: z.number(),
  recorded_at: z.string(),
  recorded_date: z.string(),
  source: z.string(),
  notes: z.string().nullable(),
});
export type AmyWeighIn = z.infer<typeof amyWeighIn>;

export const weightHistorySchema = z.object({
  entries: z.array(amyWeighIn),
  limit: z.number(),
});
export type AmyWeightHistory = z.infer<typeof weightHistorySchema>;
