import { describe, expect, it } from "vitest";
import { matchingPresets, normalizeRange, presetRange, rangeFromUrl } from "../../src/domain/range";
import { todayInTimeZone } from "../../src/app/lib/timezone";

describe("today in Amy's timezone", () => {
  it("is the calendar date in the index timezone, not UTC", () => {
    // 2026-09-28 03:30 UTC is still the evening of Sep 27 in Los Angeles.
    const now = new Date("2026-09-28T03:30:00Z");
    expect(todayInTimeZone("America/Los_Angeles", now)).toBe("2026-09-27");
    expect(todayInTimeZone("UTC", now)).toBe("2026-09-28");
  });
});

describe("presetRange", () => {
  const dayDates = ["2026-08-30", "2026-09-10", "2026-09-26"];

  it("Last 7 days is today plus the 6 days before", () => {
    expect(presetRange("last7", { today: "2026-09-27", dayDates })).toEqual({ from: "2026-09-21", to: "2026-09-27" });
  });

  it("Last 14 days is today plus the 13 days before, across a month boundary", () => {
    expect(presetRange("last14", { today: "2026-10-05", dayDates })).toEqual({ from: "2026-09-22", to: "2026-10-05" });
  });

  it("This month is the 1st through today", () => {
    expect(presetRange("thisMonth", { today: "2026-09-27", dayDates })).toEqual({ from: "2026-09-01", to: "2026-09-27" });
    expect(presetRange("thisMonth", { today: "2026-10-01", dayDates })).toEqual({ from: "2026-10-01", to: "2026-10-01" });
  });

  it("All logged days is the first Day through the last Day", () => {
    expect(presetRange("allLogged", { today: "2026-09-27", dayDates })).toEqual({ from: "2026-08-30", to: "2026-09-26" });
  });

  it("All logged days has no Range when there are no Days", () => {
    expect(presetRange("allLogged", { today: "2026-09-27", dayDates: [] })).toBeNull();
  });
});

describe("normalizeRange", () => {
  const today = "2026-09-27";

  it("keeps a valid Range as it is, with no maximum length", () => {
    expect(normalizeRange("2025-01-01", "2026-09-20", today)).toEqual({ from: "2025-01-01", to: "2026-09-20" });
  });

  it("swaps from and to when from is later", () => {
    expect(normalizeRange("2026-09-20", "2026-09-10", today)).toEqual({ from: "2026-09-10", to: "2026-09-20" });
  });

  it("pulls a future end back to today", () => {
    expect(normalizeRange("2026-09-20", "2026-10-15", today)).toEqual({ from: "2026-09-20", to: "2026-09-27" });
    expect(normalizeRange("2026-10-15", "2026-09-20", today)).toEqual({ from: "2026-09-20", to: "2026-09-27" });
    expect(normalizeRange("2026-10-01", "2026-10-15", today)).toEqual({ from: "2026-09-27", to: "2026-09-27" });
  });
});

describe("rangeFromUrl", () => {
  const ctx = { today: "2026-09-27" };
  const last7 = { from: "2026-09-21", to: "2026-09-27" };

  it("uses valid from/to values, normalized", () => {
    expect(rangeFromUrl({ from: "2026-09-01", to: "2026-09-14" }, ctx)).toEqual({ from: "2026-09-01", to: "2026-09-14" });
    expect(rangeFromUrl({ from: "2026-09-14", to: "2026-12-01" }, ctx)).toEqual({ from: "2026-09-14", to: "2026-09-27" });
  });

  it("falls back to Last 7 days when either value is missing or invalid", () => {
    expect(rangeFromUrl({ from: null, to: null }, ctx)).toEqual(last7);
    expect(rangeFromUrl({ from: "2026-09-01", to: null }, ctx)).toEqual(last7);
    expect(rangeFromUrl({ from: "2026-02-30", to: "2026-09-14" }, ctx)).toEqual(last7);
    expect(rangeFromUrl({ from: "2026-09-01", to: "yesterday" }, ctx)).toEqual(last7);
  });
});

describe("matchingPresets", () => {
  const dayDates = ["2026-09-03", "2026-09-07"];

  it("names every preset whose Range equals the current Range", () => {
    expect(matchingPresets({ from: "2026-09-21", to: "2026-09-27" }, { today: "2026-09-27", dayDates })).toEqual(["last7"]);
    // On the 7th, Last 7 days and This month are the same Range.
    expect(matchingPresets({ from: "2026-09-01", to: "2026-09-07" }, { today: "2026-09-07", dayDates })).toEqual([
      "last7",
      "thisMonth",
    ]);
    expect(matchingPresets({ from: "2026-09-03", to: "2026-09-07" }, { today: "2026-09-27", dayDates })).toEqual(["allLogged"]);
  });

  it("names none for a custom Range", () => {
    expect(matchingPresets({ from: "2026-09-02", to: "2026-09-27" }, { today: "2026-09-27", dayDates: [] })).toEqual([]);
  });
});
