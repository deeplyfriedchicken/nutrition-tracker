import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { nutritionSummarySchema } from "../../src/amy/schemas";
import { applySummaries } from "../../scripts/lib/applySummaries";
import { readIndex, writeIndex } from "../../scripts/lib/io";

const dirs: string[] = [];
function makeTempDataDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "nutrition-tracker-test-"));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const emptySummary = nutritionSummarySchema.parse({
  date: "2026-09-25",
  timezone: "America/Los_Angeles",
  totals: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, water_milliliters: 0 },
  goals: { calories: 3493, protein: 182, carbs: 472, fat: 97, sugar: 25, fiber: 25, sodium: 2300, water_milliliters: 3000 },
  entries: [],
});

const dayWithItemsSummary = nutritionSummarySchema.parse({
  date: "2026-09-25",
  timezone: "America/Los_Angeles",
  totals: { calories: 500, protein: 20, carbs: 50, fat: 10, sugar: 5, fiber: 3, sodium: 400, water_milliliters: 0 },
  goals: { calories: 3493, protein: 182, carbs: 472, fat: 97, sugar: 25, fiber: 25, sodium: 2300, water_milliliters: 3000 },
  entries: [
    {
      id: "entry-1",
      date: "2026-09-25",
      totals: { calories: 500, protein: 20, carbs: 50, fat: 10, sugar: 5, fiber: 3, sodium: 400, water_milliliters: 0 },
      created_at: "2026-09-25T12:00:00+00:00",
      items: [
        {
          id: "item-1",
          description: "Test food",
          detailed_description: null,
          ai_comment: null,
          confidence_score: 90,
          is_water_entry: false,
          water_milliliters: 0,
          line_index: 0,
          updated_at: "2026-09-25T12:00:00+00:00",
          calories: 500,
          protein: 20,
          carbs: 50,
          fat: 10,
          sugar: 5,
          fiber: 3,
          sodium: 400,
        },
      ],
    },
  ],
});

describe("refresh write rules", () => {
  it("deletes an existing Day and its index row when the refresh returns no Items", async () => {
    const dataDir = makeTempDataDir();

    const index = await readIndex(dataDir);
    index.timezone = "America/Los_Angeles";
    await applySummaries(dataDir, index, [dayWithItemsSummary]);
    await writeIndex(dataDir, index);

    const dayFile = path.join(dataDir, "days", "2026-09-25.json");
    expect(existsSync(dayFile)).toBe(true);
    expect(index.days["2026-09-25"]).toBeDefined();

    const index2 = await readIndex(dataDir);
    await applySummaries(dataDir, index2, [emptySummary]);
    await writeIndex(dataDir, index2);

    expect(existsSync(dayFile)).toBe(false);
    expect(index2.days["2026-09-25"]).toBeUndefined();
  });

  it("produces byte-identical output when run twice against unchanged data", async () => {
    const dataDir = makeTempDataDir();

    const index1 = await readIndex(dataDir);
    index1.timezone = "America/Los_Angeles";
    await applySummaries(dataDir, index1, [dayWithItemsSummary]);
    await writeIndex(dataDir, index1);

    const dayFile = path.join(dataDir, "days", "2026-09-25.json");
    const indexFile = path.join(dataDir, "index.json");
    const dayBytes1 = readFileSync(dayFile, "utf8");
    const indexBytes1 = readFileSync(indexFile, "utf8");

    const index2 = await readIndex(dataDir);
    await applySummaries(dataDir, index2, [dayWithItemsSummary]);
    await writeIndex(dataDir, index2);

    const dayBytes2 = readFileSync(dayFile, "utf8");
    const indexBytes2 = readFileSync(indexFile, "utf8");

    expect(dayBytes2).toBe(dayBytes1);
    expect(indexBytes2).toBe(indexBytes1);
    expect(dayBytes1.endsWith("\n")).toBe(true);
  });
});
