import { getNutritionSummary, getWeightHistory } from "../src/amy/client";
import { amyWeighInsByDate } from "../src/domain/convertWeighIns";
import { DEFAULT_DATA_DIR, readIndex, readWeighIns, writeIndex, writeWeighIns } from "./lib/io";
import { applySummaries } from "./lib/applySummaries";
import { mergeWeighInLog } from "./lib/mergeWeighIns";
import { shiftDate } from "./lib/dates";
import { isMainModule } from "./lib/isMain";

/**
 * Refresh: today, today-1, today-2 (in Amy's own terms, never the runner's
 * UTC clock) plus the last 30 weigh-ins. All requests and validation happen
 * before any file is written, so a failure never leaves partial data.
 */
export async function refresh(dataDir = DEFAULT_DATA_DIR) {
  const todaySummary = await getNutritionSummary();
  const today = todaySummary.date;
  const otherDates = [shiftDate(today, -1), shiftDate(today, -2)];
  const summaries = [todaySummary];
  for (const date of otherDates) {
    summaries.push(await getNutritionSummary(date));
  }

  const weightHistory = await getWeightHistory(30);

  const index = await readIndex(dataDir);
  index.timezone = todaySummary.timezone;
  await applySummaries(dataDir, index, summaries);
  await writeIndex(dataDir, index);

  const existingLog = await readWeighIns(dataDir);
  const fetchedByDate = amyWeighInsByDate(weightHistory.entries);
  const merged = mergeWeighInLog(existingLog, fetchedByDate, weightHistory.entries.length, weightHistory.limit);
  await writeWeighIns(dataDir, merged);

  const dates = [...otherDates, today].sort();
  return { firstDate: dates[0], lastDate: dates[dates.length - 1] };
}

if (isMainModule(import.meta.url)) {
  refresh()
    .then(({ firstDate, lastDate }) => {
      console.log(`FIRST_DATE=${firstDate}`);
      console.log(`LAST_DATE=${lastDate}`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
