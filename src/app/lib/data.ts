import type { Day, DayIndex, WeighInLog } from "../../domain/types";

export async function fetchIndex(): Promise<DayIndex> {
  const res = await fetch("/data/index.json");
  if (!res.ok) throw new Error(`Failed to load index.json: ${res.status}`);
  return res.json() as Promise<DayIndex>;
}

export async function fetchWeighIns(): Promise<WeighInLog> {
  const res = await fetch("/data/weigh-ins.json");
  if (!res.ok) throw new Error(`Failed to load weigh-ins.json: ${res.status}`);
  return res.json() as Promise<WeighInLog>;
}

export async function fetchDay(date: string): Promise<Day> {
  const res = await fetch(`/data/days/${date}.json`);
  if (!res.ok) throw new Error(`Failed to load day ${date}: ${res.status}`);
  return res.json() as Promise<Day>;
}
