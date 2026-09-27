import { describe, expect, it } from "vitest";
import type { DayIndex, Goals, Nutrients, WeighIn, WeighInLog } from "../../src/domain/types";
import { buildNutrientTrend, buildWeightTrend, summarizeWeightChange } from "../../src/domain/trends";
import { formatWeightChange } from "../../src/domain/units";

const ZERO: Nutrients = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, waterMl: 0 };
const GOALS: Goals = { calories: 3000, protein: 140, carbs: 200, fat: 85, sugar: 25, fiber: 25, sodium: 2300, waterMl: 3000 };

/** A synthetic index: each Day as [date, partial totals, partial goals]. */
function indexOf(days: Array<[string, Partial<Nutrients>, Partial<Goals>?]>): DayIndex {
  return {
    schemaVersion: 1,
    timezone: "America/Los_Angeles",
    days: Object.fromEntries(
      days.map(([date, totals, goals]) => [date, { totals: { ...ZERO, ...totals }, goals: { ...GOALS, ...goals } }]),
    ),
  };
}

describe("buildNutrientTrend rows", () => {
  it("has one row per calendar date in the Range, with null values on dates that aren't Days", () => {
    const index = indexOf([
      ["2026-09-01", { protein: 150 }],
      ["2026-09-03", { protein: 120 }],
    ]);
    const { rows } = buildNutrientTrend(index, { from: "2026-09-01", to: "2026-09-04" }, "protein", "2026-09-27");

    expect(rows.map((r) => r.date)).toEqual(["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]);
    expect(rows.map((r) => r.total)).toEqual([150, null, 120, null]);
    expect(rows.map((r) => r.isDay)).toEqual([true, false, true, false]);
    expect(rows[1]).toMatchObject({ dayGoal: null, met: null, inProgress: false });
  });

  it("judges each Day against its own Goals Snapshot and carries the goal line forward across gaps", () => {
    const index = indexOf([
      ["2026-09-02", { protein: 150 }, { protein: 140 }],
      ["2026-09-05", { protein: 150 }, { protein: 160 }],
    ]);
    const { rows } = buildNutrientTrend(index, { from: "2026-09-01", to: "2026-09-07" }, "protein", "2026-09-27");

    expect(rows.map((r) => r.dayGoal)).toEqual([null, 140, null, null, 160, null, null]);
    // Nothing to carry before the first Day in the Range; then stepped per Day.
    expect(rows.map((r) => r.goalLine)).toEqual([null, 140, 140, 140, 160, 160, 160]);
    expect(rows.map((r) => r.met)).toEqual([null, true, null, null, false, null, null]);
  });

  it("breaks the goal line from a Day with no goal until the next Day with one", () => {
    const index = indexOf([
      ["2026-09-01", { fat: 90 }, { fat: 85 }],
      ["2026-09-03", { fat: 90 }, { fat: null }],
      ["2026-09-05", { fat: 90 }, { fat: 80 }],
    ]);
    const { rows } = buildNutrientTrend(index, { from: "2026-09-01", to: "2026-09-06" }, "fat", "2026-09-27");

    expect(rows.map((r) => r.goalLine)).toEqual([85, 85, null, null, 80, 80]);
    expect(rows[2]).toMatchObject({ isDay: true, total: 90, dayGoal: null, met: null });
  });

  it("marks only the Day whose date is today as the In-progress Day", () => {
    const index = indexOf([
      ["2026-09-26", { carbs: 180 }],
      ["2026-09-27", { carbs: 40 }],
    ]);
    const { rows } = buildNutrientTrend(index, { from: "2026-09-26", to: "2026-09-27" }, "carbs", "2026-09-27");

    expect(rows.map((r) => r.inProgress)).toEqual([false, true]);
  });
});

describe("buildNutrientTrend summary", () => {
  it("counts Days that met their goal, leaving the In-progress Day out of N and M", () => {
    const index = indexOf([
      ["2026-09-21", { protein: 150 }], // met
      ["2026-09-22", { protein: 100 }], // not met
      ["2026-09-24", { protein: 140 }], // met (equal)
      ["2026-09-27", { protein: 200 }], // In-progress Day: met so far, but not counted
    ]);
    const { summary } = buildNutrientTrend(index, { from: "2026-09-21", to: "2026-09-27" }, "protein", "2026-09-27");

    expect(summary).toMatchObject({ hasGoal: true, metCount: 2, judgedCount: 3 });
  });

  it("counts only Days that have a goal in M", () => {
    const index = indexOf([
      ["2026-09-01", { fat: 90 }, { fat: 85 }], // met
      ["2026-09-02", { fat: 50 }, { fat: null }], // no goal: not judged
      ["2026-09-03", { fat: 70 }, { fat: 85 }], // not met
    ]);
    const { summary } = buildNutrientTrend(index, { from: "2026-09-01", to: "2026-09-03" }, "fat", "2026-09-27");

    expect(summary).toMatchObject({ hasGoal: true, metCount: 1, judgedCount: 2 });
  });

  it("averages over Days only, never calendar dates, including the In-progress Day", () => {
    const index = indexOf([
      ["2026-09-01", { calories: 3000 }],
      ["2026-09-05", { calories: 2000 }],
      ["2026-09-07", { calories: 1000 }], // In-progress Day
    ]);
    const { summary } = buildNutrientTrend(index, { from: "2026-09-01", to: "2026-09-07" }, "calories", "2026-09-07");

    expect(summary.average).toBe(2000); // (3000 + 2000 + 1000) / 3 Days, not / 7 dates
  });

  it("has no goal and no average when the Range has no Days", () => {
    const { summary } = buildNutrientTrend(indexOf([]), { from: "2026-09-01", to: "2026-09-07" }, "fat", "2026-09-27");

    expect(summary).toEqual({ hasGoal: false, metCount: 0, judgedCount: 0, average: null });
  });

  it("has no goal status when no Day in the Range has a goal, but still averages", () => {
    const index = indexOf([
      ["2026-09-01", { waterMl: 2000 }, { waterMl: null }],
      ["2026-09-02", { waterMl: 1000 }, { waterMl: null }],
    ]);
    const { rows, summary } = buildNutrientTrend(index, { from: "2026-09-01", to: "2026-09-03" }, "waterMl", "2026-09-27");

    expect(summary).toEqual({ hasGoal: false, metCount: 0, judgedCount: 0, average: 1500 });
    expect(rows.every((r) => r.goalLine === null)).toBe(true);
  });

  it("has a goal but judges nothing when only the In-progress Day has one", () => {
    const index = indexOf([
      ["2026-09-26", { carbs: 150 }, { carbs: null }],
      ["2026-09-27", { carbs: 40 }, { carbs: 200 }],
    ]);
    const { summary } = buildNutrientTrend(index, { from: "2026-09-26", to: "2026-09-27" }, "carbs", "2026-09-27");

    expect(summary).toMatchObject({ hasGoal: true, metCount: 0, judgedCount: 0 });
  });
});

function weighIn(kg: number, recordedAt: string): WeighIn {
  return { id: recordedAt, kg, recordedAt, source: "manual", notes: null };
}

function logOf(weighIns: Record<string, WeighIn[]>): WeighInLog {
  return { schemaVersion: 1, weighIns };
}

describe("buildWeightTrend", () => {
  it("has one row per calendar date, using the latest recordedAt Weigh-in on each date", () => {
    const log = logOf({
      "2026-08-31": [weighIn(90, "2026-08-31T15:00:00Z")], // before the Range
      "2026-09-01": [weighIn(84, "2026-09-01T15:00:00Z"), weighIn(83.5, "2026-09-01T22:00:00Z")],
      "2026-09-03": [weighIn(83, "2026-09-03T15:00:00Z")],
    });
    const rows = buildWeightTrend(log, { from: "2026-09-01", to: "2026-09-04" });

    expect(rows).toEqual([
      { date: "2026-09-01", kg: 83.5 },
      { date: "2026-09-02", kg: null },
      { date: "2026-09-03", kg: 83 },
      { date: "2026-09-04", kg: null },
    ]);
  });

  it("picks the latest by recordedAt even if the list isn't in order", () => {
    const log = logOf({ "2026-09-01": [weighIn(83.5, "2026-09-01T22:00:00Z"), weighIn(84, "2026-09-01T15:00:00Z")] });

    expect(buildWeightTrend(log, { from: "2026-09-01", to: "2026-09-01" })).toEqual([{ date: "2026-09-01", kg: 83.5 }]);
  });
});

describe("weight change across a Range", () => {
  it("is null with no Weigh-ins", () => {
    expect(summarizeWeightChange([{ date: "2026-09-01", kg: null }])).toBeNull();
  });

  it("uses the same Weigh-in as first and last when there is only one", () => {
    const change = summarizeWeightChange([
      { date: "2026-09-01", kg: null },
      { date: "2026-09-02", kg: 80 },
    ]);
    expect(change).toEqual({ first: { date: "2026-09-02", kg: 80 }, last: { date: "2026-09-02", kg: 80 }, count: 1 });
    expect(formatWeightChange(change!, "lb")).toBe("176.4 lb (1 weigh-in)");
  });

  it("runs from the first to the last Weigh-in in the Range", () => {
    const change = summarizeWeightChange([
      { date: "2026-09-01", kg: 84 },
      { date: "2026-09-02", kg: null },
      { date: "2026-09-03", kg: 83.5 },
      { date: "2026-09-04", kg: 82.9 },
    ]);
    expect(change).toEqual({ first: { date: "2026-09-01", kg: 84 }, last: { date: "2026-09-04", kg: 82.9 }, count: 3 });
    // 84 kg = 185.188 lb, 82.9 kg = 182.763 lb
    expect(formatWeightChange(change!, "lb")).toBe("\u22122.4 lb (185.2 \u2192 182.8)");
    expect(formatWeightChange(change!, "kg")).toBe("\u22121.1 kg (84 \u2192 82.9)");
  });

  it("shows a gain with a plus sign and no change as 0", () => {
    const gain = { first: { date: "2026-09-01", kg: 80 }, last: { date: "2026-09-05", kg: 81 }, count: 2 };
    expect(formatWeightChange(gain, "kg")).toBe("+1 kg (80 \u2192 81)");
    const flat = { first: { date: "2026-09-01", kg: 80 }, last: { date: "2026-09-05", kg: 80 }, count: 2 };
    expect(formatWeightChange(flat, "kg")).toBe("0 kg (80 \u2192 80)");
  });
});
