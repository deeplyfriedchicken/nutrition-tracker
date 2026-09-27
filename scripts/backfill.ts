import { getFoodEntries, getNutritionSummary, getWeightHistory } from "../src/amy/client";
import { amyWeighInsByDate } from "../src/domain/convertWeighIns";
import { DEFAULT_DATA_DIR, readIndex, readWeighIns, writeIndex, writeWeighIns } from "./lib/io";
import { applySummaries } from "./lib/applySummaries";
import { mergeWeighInLog } from "./lib/mergeWeighIns";
import { shiftDate } from "./lib/dates";
import { isMainModule } from "./lib/isMain";

const CHUNK_DAYS = 30;
const PACE_MS = 31_000; // >=31s apart keeps us under 120 req/hour
const PACE_THRESHOLD = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkDateRanges(start: string, end: string): Array<[string, string]> {
  const ranges: Array<[string, string]> = [];
  let cursor = start;
  while (cursor <= end) {
    let chunkEnd = shiftDate(cursor, CHUNK_DAYS - 1);
    if (chunkEnd > end) chunkEnd = end;
    ranges.push([cursor, chunkEnd]);
    cursor = shiftDate(chunkEnd, 1);
  }
  return ranges;
}

/**
 * Backfill: discover every date with Items by walking /food-entries in
 * 30-day chunks, then convert each discovered date through the same
 * Amy-summary→Day path refresh uses. Paces requests when the total is high
 * enough to risk the 120/hour rate limit. All-or-nothing write, same as
 * refresh.
 */
export async function backfill(startDate: string, endDate: string, dataDir = DEFAULT_DATA_DIR) {
  const chunks = chunkDateRanges(startDate, endDate);
  const discoveredDates = new Set<string>();
  const paceDiscovery = chunks.length > PACE_THRESHOLD;
  for (const [chunkStart, chunkEnd] of chunks) {
    const res = await getFoodEntries(chunkStart, chunkEnd, 90);
    for (const entry of res.entries) discoveredDates.add(entry.date);
    if (paceDiscovery) await sleep(PACE_MS);
  }

  const dates = [...discoveredDates].sort();
  const paceSummaries = chunks.length + dates.length > PACE_THRESHOLD;
  const summaries = [];
  for (const date of dates) {
    summaries.push(await getNutritionSummary(date));
    if (paceSummaries) await sleep(PACE_MS);
  }

  const weightHistory = await getWeightHistory(365);

  const index = await readIndex(dataDir);
  if (summaries.length > 0) index.timezone = summaries[0].timezone;
  await applySummaries(dataDir, index, summaries);
  await writeIndex(dataDir, index);

  const existingLog = await readWeighIns(dataDir);
  const fetchedByDate = amyWeighInsByDate(weightHistory.entries);
  const merged = mergeWeighInLog(existingLog, fetchedByDate, weightHistory.entries.length, weightHistory.limit);
  await writeWeighIns(dataDir, merged);
}

if (isMainModule(import.meta.url)) {
  const startDate = process.env.START_DATE ?? process.argv[2] ?? "2026-03-01";
  const endDate = process.env.END_DATE ?? process.argv[3];
  if (!endDate) {
    console.error("Usage: tsx scripts/backfill.ts <start_date> <end_date> (or START_DATE/END_DATE env vars)");
    process.exit(1);
  }
  backfill(startDate, endDate).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
