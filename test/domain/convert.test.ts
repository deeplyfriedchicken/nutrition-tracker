import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { nutritionSummarySchema } from "../../src/amy/schemas";
import { amySummaryToDay } from "../../src/domain/convert";

const FIXTURES_DIR = path.join(process.cwd(), "fixtures", "amy");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(path.join(FIXTURES_DIR, name), "utf8"));
}

describe("amySummaryToDay", () => {
  it("converts a summary with three items", () => {
    const summary = nutritionSummarySchema.parse(loadFixture("nutrition-summary.2026-05-05.json"));
    const day = amySummaryToDay(summary);

    expect(day).not.toBeNull();
    expect(day!.schemaVersion).toBe(1);
    expect(day!.date).toBe("2026-05-05");
    expect(day!.timezone).toBe("America/Los_Angeles");
    expect(day!.totals).toEqual({
      calories: 1075,
      protein: 62,
      carbs: 106,
      fat: 46.5,
      sugar: 53,
      fiber: 8,
      sodium: 2260,
      waterMl: 0,
    });
    expect(day!.goals.waterMl).toBe(3000);
    expect(day!.items).toHaveLength(3);

    const [first] = day!.items;
    expect(first.id).toBe("9cc369f6-117d-4635-bad7-3f1da87cc9e0");
    expect(first.description).toBe("Chipotle - chicken, spicy carnitas, tomato, corn");
    expect(first.detailedDescription).toBeNull();
    expect(first.aiComment).toBeNull();
    expect(first.confidence).toBe(98);
    expect(first.isWater).toBe(false);
    expect(first.updatedAt).toBe("2026-05-05T21:50:02.98168+00:00");
    expect(first.nutrition).toEqual({
      calories: 495,
      protein: 58,
      carbs: 20,
      fat: 20.5,
      sugar: 5,
      fiber: 4,
      sodium: 1640,
      waterMl: 0,
    });
  });

  it("returns null for a date with no Items", () => {
    const summary = nutritionSummarySchema.parse(loadFixture("nutrition-summary.2026-09-25.empty.json"));
    expect(amySummaryToDay(summary)).toBeNull();
  });

  it("maps a Water Item, keeping it in items with isWater true", () => {
    const foodEntries = loadFixture("food-entries.limit-5.json") as { entries: unknown[] };
    const entry = foodEntries.entries.find((e) => (e as { date: string }).date === "2026-09-26");
    const summary = nutritionSummarySchema.parse({
      date: "2026-09-26",
      timezone: "America/Los_Angeles",
      totals: (entry as { totals: unknown }).totals,
      goals: {
        calories: 3493,
        protein: 182,
        carbs: 472,
        fat: 97,
        sugar: 25,
        fiber: 25,
        sodium: 2300,
        water_milliliters: 3000,
      },
      entries: [entry],
    });

    const day = amySummaryToDay(summary)!;
    const water = day.items.find((i) => i.isWater);
    expect(water).toBeDefined();
    expect(water!.description).toBe("30oz of water");
    expect(water!.nutrition.waterMl).toBe(887);
    expect(day.totals.waterMl).toBe(887);
  });

  it("orders items by entry created_at asc, then line_index asc, across multiple entries", () => {
    const base = nutritionSummarySchema.parse(loadFixture("nutrition-summary.2026-05-05.json"));
    const [laterEntry] = base.entries;

    const earlierEntry = {
      ...laterEntry,
      id: "synth-entry-earlier",
      created_at: "2026-05-05T10:00:00.000000+00:00",
      items: [
        { ...laterEntry.items[0], id: "synth-item-a", description: "Earlier item A", line_index: 1 },
        { ...laterEntry.items[0], id: "synth-item-b", description: "Earlier item B", line_index: 0 },
      ],
    };

    const summary = nutritionSummarySchema.parse({
      ...base,
      entries: [laterEntry, earlierEntry],
    });

    const day = amySummaryToDay(summary)!;
    const ids = day.items.map((i) => i.id);
    // earlierEntry (created_at 10:00) sorts before laterEntry (created_at 21:50),
    // and within earlierEntry, line_index 0 sorts before line_index 1.
    expect(ids).toEqual([
      "synth-item-b",
      "synth-item-a",
      "9cc369f6-117d-4635-bad7-3f1da87cc9e0",
      "15126d81-a212-4285-9f53-38464a2aea31",
      "3ff3267e-ace1-4fdf-9a27-d87f6d09ed49",
    ]);
  });
});
