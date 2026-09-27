import { promises as fs } from "node:fs";
import path from "node:path";
import type { Day, DayIndex, WeighInLog } from "../../src/domain/types";

export const DEFAULT_DATA_DIR = path.join(process.cwd(), "public", "data");

function daysDir(dataDir: string): string {
  return path.join(dataDir, "days");
}

function indexPath(dataDir: string): string {
  return path.join(dataDir, "index.json");
}

function weighInsPath(dataDir: string): string {
  return path.join(dataDir, "weigh-ins.json");
}

// Byte-stable: fixed field order (as authored by callers), sorted keys, 2-space
// JSON, trailing newline. No run-level timestamps are ever written here.
function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

function sortedRecord<T>(rec: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(rec).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

export async function readIndex(dataDir: string): Promise<DayIndex> {
  try {
    const raw = await fs.readFile(indexPath(dataDir), "utf8");
    return JSON.parse(raw) as DayIndex;
  } catch {
    return { schemaVersion: 1, timezone: "", days: {} };
  }
}

export async function readWeighIns(dataDir: string): Promise<WeighInLog> {
  try {
    const raw = await fs.readFile(weighInsPath(dataDir), "utf8");
    return JSON.parse(raw) as WeighInLog;
  } catch {
    return { schemaVersion: 1, weighIns: {} };
  }
}

export async function readDay(dataDir: string, date: string): Promise<Day | null> {
  try {
    const raw = await fs.readFile(path.join(daysDir(dataDir), `${date}.json`), "utf8");
    return JSON.parse(raw) as Day;
  } catch {
    return null;
  }
}

export async function writeDay(dataDir: string, day: Day): Promise<void> {
  await fs.mkdir(daysDir(dataDir), { recursive: true });
  await fs.writeFile(path.join(daysDir(dataDir), `${day.date}.json`), stringify(day));
}

export async function deleteDay(dataDir: string, date: string): Promise<void> {
  await fs.rm(path.join(daysDir(dataDir), `${date}.json`), { force: true });
}

export async function writeIndex(dataDir: string, index: DayIndex): Promise<void> {
  const sorted: DayIndex = { schemaVersion: 1, timezone: index.timezone, days: sortedRecord(index.days) };
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(indexPath(dataDir), stringify(sorted));
}

export async function writeWeighIns(dataDir: string, log: WeighInLog): Promise<void> {
  const sorted: WeighInLog = { schemaVersion: 1, weighIns: sortedRecord(log.weighIns) };
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(weighInsPath(dataDir), stringify(sorted));
}
