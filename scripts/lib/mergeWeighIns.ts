import type { WeighIn, WeighInLog } from "../../src/domain/types";

/**
 * Merge rule: if Amy returned fewer than the requested limit, it returned the
 * whole history, so replace the log wholesale. Otherwise the fetch is a
 * recent window; find `oldest`, the earliest returned recorded_date, and
 * replace every date strictly after it with fetched data while leaving
 * `oldest` and earlier dates untouched (oldest may be only partially
 * returned, so we must not clobber it with a partial page).
 */
export function mergeWeighInLog(
  existing: WeighInLog,
  fetchedByDate: Record<string, WeighIn[]>,
  n: number,
  limit: number,
): WeighInLog {
  if (n < limit) {
    return { schemaVersion: 1, weighIns: fetchedByDate };
  }

  const fetchedDates = Object.keys(fetchedByDate).sort();
  const oldest = fetchedDates[0];
  const merged: Record<string, WeighIn[]> = {};

  for (const [date, list] of Object.entries(existing.weighIns)) {
    if (date <= oldest) merged[date] = list;
  }
  for (const [date, list] of Object.entries(fetchedByDate)) {
    if (date > oldest) merged[date] = list;
  }

  return { schemaVersion: 1, weighIns: merged };
}
