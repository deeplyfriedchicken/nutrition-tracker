import type { AmyWeighIn } from "../amy/schemas";
import type { WeighIn } from "./types";

/**
 * Groups Amy weigh-ins by their local recorded_date (never derived from the
 * UTC recorded_at), sorting each date's list by recordedAt ascending.
 */
export function amyWeighInsByDate(entries: AmyWeighIn[]): Record<string, WeighIn[]> {
  const byDate: Record<string, WeighIn[]> = {};
  for (const e of entries) {
    const weighIn: WeighIn = {
      id: e.id,
      kg: e.weight_kg,
      recordedAt: e.recorded_at,
      source: e.source,
      notes: e.notes,
    };
    (byDate[e.recorded_date] ??= []).push(weighIn);
  }
  for (const list of Object.values(byDate)) {
    list.sort((a, b) => (a.recordedAt < b.recordedAt ? -1 : a.recordedAt > b.recordedAt ? 1 : 0));
  }
  return byDate;
}
