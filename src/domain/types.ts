export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  waterMl: number;
};

export type Goals = { [K in keyof Nutrients]: number | null }; // Goals Snapshot

export type Item = {
  id: string;
  description: string;
  detailedDescription: string | null;
  aiComment: string | null;
  confidence: number | null; // 0-100
  isWater: boolean;
  updatedAt: string; // ISO timestamp from Amy
  nutrition: Nutrients;
};

export type Day = {
  schemaVersion: 1;
  date: string; // YYYY-MM-DD, Amy timezone
  timezone: string; // e.g. "America/Los_Angeles"
  totals: Nutrients; // Amy's day totals, never recomputed by us
  goals: Goals;
  items: Item[]; // flat; ordered by Amy entry created_at asc, then line_index asc
};

export type DayIndex = {
  schemaVersion: 1;
  timezone: string;
  days: Record<string, { totals: Nutrients; goals: Goals }>; // keys sorted asc
};

export type WeighIn = {
  id: string;
  kg: number;
  recordedAt: string;
  source: string;
  notes: string | null;
};

export type WeighInLog = {
  schemaVersion: 1;
  weighIns: Record<string, WeighIn[]>; // keyed by Amy recorded_date, keys sorted asc, each list sorted by recordedAt asc
};
