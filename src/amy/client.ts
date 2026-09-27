import {
  nutritionSummarySchema,
  foodEntriesSchema,
  weightHistorySchema,
  type AmyNutritionSummary,
  type AmyFoodEntries,
  type AmyWeightHistory,
} from "./schemas";

const BASE_URL = "https://connect.amyfoodjournal.com";

function authHeaders(): HeadersInit {
  const key = process.env.AMY_API_KEY;
  if (!key) throw new Error("AMY_API_KEY is not set");
  return { Authorization: `Bearer ${key}` };
}

async function getJson(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`Amy API request failed: ${res.status} ${res.statusText} (${path})`);
  }
  return res.json();
}

/** GET /nutrition/summary. Omit `date` to get today (in Amy's timezone). */
export async function getNutritionSummary(date?: string): Promise<AmyNutritionSummary> {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  return nutritionSummarySchema.parse(await getJson(`/api/v1/nutrition/summary${qs}`));
}

export async function getFoodEntries(startDate: string, endDate: string, limit = 90): Promise<AmyFoodEntries> {
  const qs = `?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&limit=${limit}`;
  return foodEntriesSchema.parse(await getJson(`/api/v1/food-entries${qs}`));
}

export async function getWeightHistory(limit: number): Promise<AmyWeightHistory> {
  return weightHistorySchema.parse(await getJson(`/api/v1/weight-history?limit=${limit}`));
}
