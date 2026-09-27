const KG_TO_LB = 2.20462;

/** Thousands separators, at most 1 decimal, trailing ".0" dropped. */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function formatLb(kg: number): string {
  return formatNumber(kgToLb(kg));
}
