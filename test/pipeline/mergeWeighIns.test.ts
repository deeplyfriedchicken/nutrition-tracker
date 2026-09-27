import { describe, expect, it } from "vitest";
import { mergeWeighInLog } from "../../scripts/lib/mergeWeighIns";
import type { WeighIn, WeighInLog } from "../../src/domain/types";

function weighIn(id: string, kg: number, recordedAt: string): WeighIn {
  return { id, kg, recordedAt, source: "test", notes: null };
}

describe("mergeWeighInLog", () => {
  it("replaces the whole log when n < limit (Amy returned everything)", () => {
    const existing: WeighInLog = {
      schemaVersion: 1,
      weighIns: { "2026-01-01": [weighIn("old", 70, "2026-01-01T00:00:00+00:00")] },
    };
    const fetchedByDate = {
      "2026-03-01": [weighIn("a", 74.8, "2026-03-02T01:59:08.5+00:00"), weighIn("b", 74.8, "2026-03-02T01:59:08.7+00:00")],
    };

    const result = mergeWeighInLog(existing, fetchedByDate, 2, 30);

    expect(result).toEqual({ schemaVersion: 1, weighIns: fetchedByDate });
  });

  it("preserves the oldest returned date and earlier when n == limit (partial page)", () => {
    const existing: WeighInLog = {
      schemaVersion: 1,
      weighIns: {
        "2026-01-01": [weighIn("ancient", 80, "2026-01-01T00:00:00+00:00")],
        "2026-02-15": [weighIn("stale-oldest", 78, "2026-02-15T00:00:00+00:00"), weighIn("stale-oldest-2", 78.1, "2026-02-15T08:00:00+00:00")],
        "2026-03-01": [weighIn("stale-newer", 76, "2026-03-01T00:00:00+00:00")],
      },
    };
    // Fetched page's oldest date is 2026-02-15, but it's a partial page for
    // that date (only one of the two weigh-ins came back).
    const fetchedByDate = {
      "2026-02-15": [weighIn("fresh-oldest", 78, "2026-02-15T00:00:00+00:00")],
      "2026-03-01": [weighIn("fresh-newer", 76.5, "2026-03-01T00:00:00+00:00")],
    };

    const result = mergeWeighInLog(existing, fetchedByDate, 30, 30);

    expect(result.weighIns["2026-01-01"]).toEqual(existing.weighIns["2026-01-01"]);
    // oldest date (2026-02-15) is left untouched, i.e. the pre-existing (full) data wins
    expect(result.weighIns["2026-02-15"]).toEqual(existing.weighIns["2026-02-15"]);
    // strictly-after dates are replaced with fetched data
    expect(result.weighIns["2026-03-01"]).toEqual(fetchedByDate["2026-03-01"]);
  });
});
