import { formatNumber } from "./format";

/**
 * Display units. Stored data never changes: water is always ml and weight is
 * always kg. These only convert for display; Goal Met is judged in stored units.
 */
export type WaterUnit = "floz" | "ml";
export type WeightUnit = "lb" | "kg";

const ML_PER_FL_OZ = 29.5735;
const LB_PER_KG = 2.20462;

export const WATER_UNIT_LABEL: Record<WaterUnit, string> = { floz: "fl oz", ml: "ml" };
export const WEIGHT_UNIT_LABEL: Record<WeightUnit, string> = { lb: "lb", kg: "kg" };

export function mlToFlOz(ml: number): number {
  return ml / ML_PER_FL_OZ;
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function convertWater(ml: number, unit: WaterUnit): number {
  return unit === "floz" ? mlToFlOz(ml) : ml;
}

export function convertWeight(kg: number, unit: WeightUnit): number {
  return unit === "lb" ? kgToLb(kg) : kg;
}

export function formatWater(ml: number, unit: WaterUnit): string {
  return `${formatNumber(convertWater(ml, unit))} ${WATER_UNIT_LABEL[unit]}`;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${formatNumber(convertWeight(kg, unit))} ${WEIGHT_UNIT_LABEL[unit]}`;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * "−2.4 lb (185.2 → 182.8)", or "182.8 lb (1 weigh-in)". The change is the
 * difference of the two rounded values shown, so the numbers always agree.
 */
export function formatWeightChange(
  change: { first: { kg: number }; last: { kg: number }; count: number },
  unit: WeightUnit,
): string {
  const label = WEIGHT_UNIT_LABEL[unit];
  const first = round1(convertWeight(change.first.kg, unit));
  const last = round1(convertWeight(change.last.kg, unit));
  if (change.count === 1) return `${formatNumber(last)} ${label} (1 weigh-in)`;
  const delta = round1(last - first);
  const sign = delta > 0 ? "+" : delta < 0 ? "\u2212" : "";
  return `${sign}${formatNumber(Math.abs(delta))} ${label} (${formatNumber(first)} \u2192 ${formatNumber(last)})`;
}
